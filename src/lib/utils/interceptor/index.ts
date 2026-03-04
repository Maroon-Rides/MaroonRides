import { Capacitor } from '@capacitor/core';
import { handleNativeRequest } from './handlers/native-proxy';
import { handleRangeRequest } from './handlers/range-cache';

// original fetch reference for restoring later
let originalFetch: typeof fetch;
let active = false;

export function installInterceptor() {
  if (active) {
    console.warn('[Interceptor] Already installed');
    return;
  }

  originalFetch = window.fetch;
  window.fetch = interceptFetch;
  active = true;
}

export async function interceptFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const request = new Request(input, init);
  const url = new URL(request.url);

  const rangeHeader = request.headers.get('Range');
  if (Capacitor.getPlatform() !== 'ios' && rangeHeader && url.pathname.endsWith('.pmtiles')) {
    return handleRangeRequest(request, rangeHeader);
  }

  if (url.host == 'aggiespirit.ts.tamu.edu') {
    return handleNativeRequest(input, init);
  }

  return originalFetch(request);
}
