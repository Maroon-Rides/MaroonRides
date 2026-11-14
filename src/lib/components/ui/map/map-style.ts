import type { TransformStyleFunction, VectorSourceSpecification } from 'maplibre-gl';

/** Web builds point this at R2, since Cloudflare Pages ignores the Range headers PMTiles needs. */
export const PMTILES_URL: string = import.meta.env.VITE_PMTILES_URL ?? '/map/cstat.pmtiles';

const BASEMAP_SOURCE = 'protomaps';

export function resolveMapStyle(baseUrl: string, pmtilesUrl: string): TransformStyleFunction {
  return (_previous, next) => {
    const basemap = next.sources[BASEMAP_SOURCE] as VectorSourceSpecification;

    return {
      ...next,
      // MapLibre rejects relative sprite URLs.
      sprite: typeof next.sprite === 'string' ? new URL(next.sprite, baseUrl).href : next.sprite,
      sources: {
        ...next.sources,
        [BASEMAP_SOURCE]: { ...basemap, url: `pmtiles://${pmtilesUrl}` },
      },
    };
  };
}
