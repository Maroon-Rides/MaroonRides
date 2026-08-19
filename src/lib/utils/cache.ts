import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';

const CACHE_DIR = Directory.Cache;

type CacheContent = {
  expiryUtcMillis: number;
  content: any;
};
function isCacheContent(a: any): a is CacheContent {
  return (
    typeof a === 'object' &&
    a !== null &&
    !Array.isArray(a) &&
    // ^ is Record
    a.expiryUtcMillis !== undefined &&
    a.content !== undefined
  );
}

// non-web capacitor only supports utf8 string data
export type CachingOptions = {
  expiryMillis?: number;
  isOffset?: boolean;
  recursive?: boolean;
  overwrite?: boolean;
};

export type CacheWriteResult = {
  failedFileExists?: boolean;
  failedRewrappedData?: boolean;
  failedWriteError?: boolean;
  writeError?: any;
  uri?: string;
};

export type CacheReadResult = {
  failedFileNotFound?: boolean;
  failedJSONRead?: boolean;
  failedOpenError?: boolean;
  openError?: any;

  failedExpired?: boolean;
  data?: any;
};
// & ReadFileResult;
export async function tryCache(
  path: string,
  data: any,
  options: CachingOptions = {},
): Promise<CacheWriteResult> {
  const expiry = options.expiryMillis ?? Infinity;

  if (!options.overwrite) {
    let exists = true;
    try {
      await Filesystem.stat({
        directory: CACHE_DIR,
        path: path,
      });
    } catch {
      exists = false;
    }
    if (exists) return { failedFileExists: true };
  }

  const wrapped = wrap(data, options.isOffset ? Date.now() + expiry : expiry, false);
  if (!wrapped) return { failedRewrappedData: true };

  try {
    return (await Filesystem.writeFile({
      directory: CACHE_DIR,
      path: path,
      data: JSON.stringify(wrapped),
      encoding: Encoding.UTF8,
      recursive: options.recursive,
    })) as CacheWriteResult;
  } catch (error) {
    return { failedWriteError: true, writeError: error };
  }
}

// does not validate output data
export async function tryUncache(path: string): Promise<CacheReadResult> {
  // exists
  try {
    await Filesystem.stat({
      directory: CACHE_DIR,
      path: path,
    });
  } catch {
    return { failedFileNotFound: true };
  }

  // read
  let raw: string;
  try {
    raw = (
      await Filesystem.readFile({
        directory: CACHE_DIR,
        path: path,
        encoding: Encoding.UTF8,
      })
    ).data as string;
  } catch (error) {
    return { failedOpenError: true, openError: error };
  }

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { failedJSONRead: true };
  }
  if (!isCacheContent(data)) return { failedJSONRead: true };
  if (expired(data)) return { failedExpired: true };
  return { data: data.content };
}

function wrap(content: any, expiryUtcMillis: number, nest: boolean = false): CacheContent | null {
  if (!nest && isCacheContent(content)) return null;
  return {
    expiryUtcMillis,
    content,
  };
}
function expired(c: CacheContent): boolean {
  return Date.now() >= c.expiryUtcMillis;
}
