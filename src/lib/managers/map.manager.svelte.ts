import type { Route } from '$lib/data/types';
import MapLibreGL from 'maplibre-gl';

class MapManager {
  map: MapLibreGL.Map | null = $state(null);

  drawnRoutes: Route[] = $state([]);

  registerMap(map: MapLibreGL.Map) {
    this.map = map;
    console.log('Map registered');
  }

  unregisterMap() {
    this.map = null;
  }
}

// Persist mapManager across Svelte HMRs
let mapManager: MapManager;

if (import.meta.hot && import.meta.hot.data) {
  if (!import.meta.hot.data.mapManager) {
    import.meta.hot.data.mapManager = new MapManager();
  }
  mapManager = import.meta.hot.data.mapManager;
} else {
  mapManager = new MapManager();
}

export { mapManager };
