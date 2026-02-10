import type { Location, Route } from '$lib/data/types';
import MapLibreGL from 'maplibre-gl';

class MapManager {
  map: MapLibreGL.Map | null = $state(null);

  isCentered: boolean = $state(false);

  drawnRoutes: Route[] = $state([]);
  selectedRoute: Route | null = $state(null);

  mapWidth: number = $state(0);
  mapHeight: number = $state(0);

  registerMap(map: MapLibreGL.Map) {
    this.map = map;

    this.map.on('rotate', () => (this.isCentered = false));
    this.map.on('pitch', () => (this.isCentered = false));
    this.map.on('dragstart', () => (this.isCentered = false));

    return () => {};
  }

  unregisterMap() {
    this.map?.off('rotate', () => (this.isCentered = false));
    this.map?.off('pitch', () => (this.isCentered = false));
    this.map?.off('dragstart', () => (this.isCentered = false));
    this.map = null;
  }

  setDrawnRoutes(routes: Route[], animateTo: boolean = true) {
    this.drawnRoutes = routes;

    if (animateTo) {
      const allPoints = routes.flatMap((route) =>
        route.directions.flatMap((direction) =>
          direction.pathPoints.map((point) => ({
            latitude: point.latitude,
            longitude: point.longitude,
          })),
        ),
      );

      if (allPoints.length > 0) {
        this.zoomToFitPoints(allPoints);
      }
    }
  }

  setSelectedRoute(route: Route | null) {
    if (!this.map) return;

    this.selectedRoute = route;
    if (route) {
      this.setDrawnRoutes([route]);
    }
  }

  zoomToFitPoints(points: Location[]) {
    this.isCentered = false;

    let minLat = Math.min(...points.map((p) => p.latitude));
    let maxLat = Math.max(...points.map((p) => p.latitude));
    let minLng = Math.min(...points.map((p) => p.longitude));
    let maxLng = Math.max(...points.map((p) => p.longitude));

    this.map?.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      {
        padding: {
          top: this.mapHeight * 0.1,
          bottom: this.mapHeight * 0.45 + 8,
          left: 40,
          right: 40,
        },
        duration: 1000,
        maxZoom: 16,
      },
    );
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
