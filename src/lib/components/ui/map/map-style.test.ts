import type { StyleSpecification } from 'maplibre-gl';
import { describe, expect, it } from 'vitest';
import { resolveMapStyle } from './map-style';

const BASE_URL = 'https://web.maroonrides.app/route/1';
const R2_PMTILES = 'https://tiles.maroonrides.app/cstat-abc.pmtiles';

const STYLE: StyleSpecification = {
  version: 8,
  sprite: '/map/sprites/light',
  glyphs: '/map/fonts/{fontstack}/{range}.pbf',
  sources: {
    protomaps: { type: 'vector', url: 'pmtiles:///map/cstat.pmtiles', attribution: 'OSM' },
    routes: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } },
  },
  layers: [],
};

describe('resolveMapStyle', () => {
  it('points the basemap at the given pmtiles url', () => {
    const style = resolveMapStyle(BASE_URL, R2_PMTILES)(undefined, STYLE);

    expect(style.sources.protomaps).toEqual({
      type: 'vector',
      url: `pmtiles://${R2_PMTILES}`,
      attribution: 'OSM',
    });
  });

  it('keeps the bundled basemap url when given the bundled path', () => {
    const style = resolveMapStyle(BASE_URL, '/map/cstat.pmtiles')(undefined, STYLE);

    expect(style.sources.protomaps).toMatchObject({ url: 'pmtiles:///map/cstat.pmtiles' });
  });

  it('makes the sprite url absolute against the page origin', () => {
    const style = resolveMapStyle(BASE_URL, R2_PMTILES)(undefined, STYLE);

    expect(style.sprite).toBe('https://web.maroonrides.app/map/sprites/light');
  });

  it('leaves other sources untouched', () => {
    const style = resolveMapStyle(BASE_URL, R2_PMTILES)(undefined, STYLE);

    expect(style.sources.routes).toBe(STYLE.sources.routes);
  });
});
