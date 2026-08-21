import type { Location, Route, Stop } from '$lib/data/types';
import { findBoundingBox } from '$lib/utils/geo';
import MapLibreGL, { type VectorSourceSpecification } from 'maplibre-gl';

class MapManager {
  map: MapLibreGL.Map | null = $state(null);

  isCentered: boolean = $state(false);

  drawnRoutes: Route[] = $state([]);
  selectedRoute: Route | null = $state(null);
  selectedDirectionId: string = $state('');
  selectedStopId: string | null = $state(null);

  attribution: string = $state('');

  mapWidth: number = $state(0);
  mapHeight: number = $state(0);

  #uncenter = () => (this.isCentered = false);

  // getStyle() returns undefined while a style is loading, so keep listening until it resolves
  #readAttribution = () => {
    const source = this.map?.getStyle()?.sources.protomaps as VectorSourceSpecification | undefined;
    if (!source?.attribution) return;

    this.attribution = source.attribution;
    this.map?.off('styledata', this.#readAttribution);
  };

  registerMap(map: MapLibreGL.Map) {
    this.map = map;

    map.on('rotate', this.#uncenter);
    map.on('pitch', this.#uncenter);
    map.on('dragstart', this.#uncenter);
    map.on('styledata', this.#readAttribution);

    this.#readAttribution();
  }

  unregisterMap() {
    this.map?.off('rotate', this.#uncenter);
    this.map?.off('pitch', this.#uncenter);
    this.map?.off('dragstart', this.#uncenter);
    this.map?.off('styledata', this.#readAttribution);

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
    this.selectedStopId = null;
    this.selectedDirectionId = '';
    if (route) {
      this.setDrawnRoutes([route]);
    }
  }

  zoomToStop(stop: Stop) {
    if (!this.map) return;

    this.isCentered = false;
    this.selectedStopId = stop.id;

    this.map.flyTo({
      center: [stop.location.longitude, stop.location.latitude],
      zoom: 17,
      duration: 750,
      offset: [0, -this.mapHeight * 0.225],
    });
  }

  zoomToFitPoints(points: Location[]) {
    const [min, max] = findBoundingBox(points);
    if (!min || !max) return;

    this.isCentered = false;

    this.map?.fitBounds(
      [
        [min.longitude, min.latitude],
        [max.longitude, max.latitude],
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
