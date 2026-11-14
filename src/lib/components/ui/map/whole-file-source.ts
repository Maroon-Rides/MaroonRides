import type { RangeResponse, Source } from 'pmtiles';

/** Serves PMTiles reads from a single full download, for hosts that ignore Range headers. */
export class WholeFileSource implements Source {
  #url: string;
  #bytes: Promise<ArrayBuffer> | null = null;

  constructor(url: string) {
    this.#url = url;
  }

  getKey() {
    return this.#url;
  }

  async getBytes(offset: number, length: number): Promise<RangeResponse> {
    this.#bytes ??= this.#download();
    const bytes = await this.#bytes;
    return { data: bytes.slice(offset, offset + length) };
  }

  async #download() {
    const response = await fetch(this.#url);
    if (!response.ok) {
      this.#bytes = null;
      throw new Error(`basemap download failed with ${response.status}`);
    }
    return response.arrayBuffer();
  }
}
