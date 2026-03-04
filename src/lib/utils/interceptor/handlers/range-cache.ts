/// <reference types="@sveltejs/kit" />
/// <reference lib="webworker" />

interface ParsedRange {
  start: number;
  end: number;
}

const memCache = new Map<string, Response>();

/**
 * Handles range requests for assets by caching the full resource
 * and serving partial content on subsequent requests.
 */
export async function handleRangeRequest(request: Request, rangeHeader: string): Promise<Response> {
  let cachedResponse = memCache.get(request.url);

  if (!cachedResponse) {
    console.log(`[SW] Cache miss — fetching full asset: ${request.url}`);

    const strippedHeaders = new Headers(request.headers);
    strippedHeaders.delete('Range');

    const fullRequest = new Request(request.url, {
      method: 'GET',
      headers: strippedHeaders,
      mode: request.mode,
      credentials: request.credentials,
      redirect: request.redirect,
    });

    let fullResponse: Response;
    try {
      fullResponse = await fetch(fullRequest);
    } catch (err) {
      console.error('[SW] Failed to fetch full asset:', err);
      return new Response('Failed to fetch asset', { status: 502 });
    }

    if (!fullResponse.ok) {
      console.warn(`[SW] Server returned ${fullResponse.status} for ${request.url}`);
      return fullResponse;
    }

    memCache.set(request.url, fullResponse.clone());
    cachedResponse = fullResponse;
  }

  return buildRangeResponse(cachedResponse, rangeHeader);
}

async function buildRangeResponse(fullResponse: Response, rangeHeader: string): Promise<Response> {
  const arrayBuffer = await fullResponse.clone().arrayBuffer();
  const totalSize = arrayBuffer.byteLength;

  const parsed = parseRangeHeader(rangeHeader, totalSize);

  if (!parsed) {
    return new Response(null, {
      status: 416,
      statusText: 'Range Not Satisfiable',
      headers: { 'Content-Range': `bytes */${totalSize}` },
    });
  }

  const { start, end } = parsed;
  const chunk = arrayBuffer.slice(start, end + 1);
  const contentType = fullResponse.headers.get('Content-Type') ?? 'application/octet-stream';

  const headers: Record<string, string> = {
    'Content-Type': contentType,
    'Content-Range': `bytes ${start}-${end}/${totalSize}`,
    'Content-Length': String(chunk.byteLength),
    'Accept-Ranges': 'bytes',
  };

  const etag = fullResponse.headers.get('ETag');
  const lastModified = fullResponse.headers.get('Last-Modified');
  if (etag) headers['ETag'] = etag;
  if (lastModified) headers['Last-Modified'] = lastModified;

  return new Response(chunk, {
    status: 206,
    statusText: 'Partial Content',
    headers,
  });
}

/**
 * Parses a Range header into { start, end }.
 * Supports: "bytes=START-END", "bytes=START-", "bytes=-SUFFIX"
 * Returns null for invalid or unsatisfiable ranges.
 */
function parseRangeHeader(rangeHeader: string, totalSize: number): ParsedRange | null {
  const match = rangeHeader.match(/^bytes=(\d*)-(\d*)$/);
  if (!match) return null;

  const rawStart = match[1];
  const rawEnd = match[2];

  if (rawStart === '' && rawEnd === '') return null;

  let start: number;
  let end: number;

  if (rawStart === '') {
    // Suffix range: bytes=-500 → last 500 bytes
    const suffixLength = parseInt(rawEnd, 10);
    start = Math.max(0, totalSize - suffixLength);
    end = totalSize - 1;
  } else if (rawEnd === '') {
    // Open-ended: bytes=1024-
    start = parseInt(rawStart, 10);
    end = totalSize - 1;
  } else {
    start = parseInt(rawStart, 10);
    end = parseInt(rawEnd, 10);
  }

  if (start > end || start >= totalSize || end >= totalSize) return null;

  return { start, end };
}
