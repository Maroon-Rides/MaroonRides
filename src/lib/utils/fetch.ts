import { Capacitor, CapacitorHttp } from '@capacitor/core';

class CustomHeaders extends Headers {
  private _allHeaders: Map<string, string>;

  constructor(init?: HeadersInit) {
    super(init);
    this._allHeaders = new Map<string, string>(Object.entries(init || {}));
  }

  get(name: string): string | null {
    return this._allHeaders.get(name.toLowerCase()) || null;
  }
}

class CustomResponse extends Response {
  private _allHeaders: CustomHeaders;
  private _bodyString: string | object | null = null;

  constructor(body: BodyInit | null, init?: ResponseInit) {
    super(body, init);
    this._bodyString = body;
    this._allHeaders = new CustomHeaders(init?.headers);
  }

  get headers() {
    return this._allHeaders;
  }

  json(): Promise<any> {
    if (typeof this._bodyString === 'object') {
      return Promise.resolve(this._bodyString);
    }

    return Promise.resolve(JSON.parse(this._bodyString || ''));
  }

  text(): Promise<string> {
    if (typeof this._bodyString === 'string') {
      return Promise.resolve(this._bodyString);
    }

    return Promise.resolve(JSON.stringify(this._bodyString || ''));
  }
}

export function customFetch(originalFetch: typeof fetch) {
  return async (input: URL | RequestInfo, init?: RequestInit) => {
    if (typeof input !== 'string' || !input.startsWith('http') || !Capacitor.isNativePlatform()) {
      return originalFetch(input, init);
    }

    const response = await CapacitorHttp.request({
      url: input as string,
      method: init?.method || 'GET',
      headers: init?.headers as Record<string, string>,
      data: init?.body,
    });

    return new CustomResponse(response.data, {
      status: response.status,
      headers: response.headers,
    });
  };
}
