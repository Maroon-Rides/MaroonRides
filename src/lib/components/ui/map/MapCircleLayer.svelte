<script lang="ts" module>
  /** Geometry for one circle. */
  export type MapCircle = {
    id: string;
    longitude: number;
    latitude: number;
  };

  export type MapCircleStyle = {
    /** Fill color as CSS color value */
    color: string;
    /** Stroke color as CSS color value */
    strokeColor: string;
    /** Fill and stroke opacity from 0 to 1 */
    opacity: number;
  };

  export type MapCircleLayerProps = {
    /** Unique identifier for the circle source and layer */
    id: string;
    /** Geometry only. Changing this re-tiles the source, so keep it stable across restyles. */
    circles: MapCircle[];
    /** Paint keyed by circle id, applied as match expressions so restyling never re-tiles. */
    styles: Record<string, MapCircleStyle>;
    /** Circle radius in pixels (default: 6) */
    radius?: number;
    /** Stroke width in pixels (default: 2) */
    strokeWidth?: number;
    /** Pixel padding around a tap that still counts as a hit, for a usable touch target */
    hitRadius?: number;
    beforeId?: string;
    /** Callback with the id of the clicked circle, or null when the tap missed every circle */
    onclick?: (id: string | null) => void;
  };

  export const circleLayerId = (id: string) => `circle-layer-${id}`;
  export const circleSourceId = (id: string) => `circle-source-${id}`;
</script>

<script lang="ts">
  import type MapLibreGL from 'maplibre-gl';
  import { type LayerSpecification } from 'maplibre-gl';
  import { getContext, untrack } from 'svelte';
  import type { MapContext } from './Map.svelte';

  let {
    id,
    circles,
    styles,
    radius = 6,
    strokeWidth = 2,
    hitRadius = 14,
    beforeId,
    onclick,
  }: MapCircleLayerProps = $props();

  const mapCtx = getContext<MapContext>('map');

  const sourceId = $derived(circleSourceId(id));
  const layerId = $derived(circleLayerId(id));

  const data = $derived({
    type: 'FeatureCollection',
    features: circles.map((circle) => ({
      type: 'Feature',
      properties: { circleId: circle.id },
      geometry: { type: 'Point', coordinates: [circle.longitude, circle.latitude] },
    })),
  } as GeoJSON.FeatureCollection<GeoJSON.Point>);

  function matchStyle(key: keyof MapCircleStyle, fallback: string | number) {
    const cases = Object.entries(styles).flatMap(([circleId, style]) => [circleId, style[key]]);
    return cases.length > 0 ? ['match', ['get', 'circleId'], ...cases, fallback] : fallback;
  }

  const color = $derived(matchStyle('color', '#4285F4'));
  const strokeColor = $derived(matchStyle('strokeColor', '#ffffff'));
  const opacity = $derived(matchStyle('opacity', 1));

  $effect(() => {
    const map = mapCtx.getMap();
    const style = mapCtx.getStyle();
    const layer = layerId;
    const source = sourceId;

    if (!style || !map) return;

    untrack(() => {
      map.addSource(source, { type: 'geojson', data });
      map.addLayer(
        {
          id: layer,
          type: 'circle',
          source,
          paint: {
            'circle-color': color,
            'circle-radius': radius,
            'circle-opacity': opacity,
            'circle-stroke-color': strokeColor,
            'circle-stroke-width': strokeWidth,
            'circle-stroke-opacity': opacity,
          },
        } as LayerSpecification,
        beforeId && map.getLayer(beforeId) ? beforeId : undefined,
      );
    });

    return () => {
      if (map.getLayer(layer)) map.removeLayer(layer);
      if (map.getSource(source)) map.removeSource(source);
    };
  });

  $effect(() => {
    const source = mapCtx.getMap()?.getSource(sourceId) as MapLibreGL.GeoJSONSource | undefined;
    source?.setData(data);
  });

  $effect(() => {
    const map = mapCtx.getMap();
    if (!map?.getLayer(layerId)) return;

    map.setPaintProperty(layerId, 'circle-color', color);
    map.setPaintProperty(layerId, 'circle-opacity', opacity);
    map.setPaintProperty(layerId, 'circle-stroke-color', strokeColor);
    map.setPaintProperty(layerId, 'circle-stroke-opacity', opacity);
    map.setPaintProperty(layerId, 'circle-radius', radius);
    map.setPaintProperty(layerId, 'circle-stroke-width', strokeWidth);
  });

  $effect(() => {
    const map = mapCtx.getMap();
    const style = mapCtx.getStyle();

    if (!style || !map || !onclick) return;

    const handleClick = (e: MapLibreGL.MapMouseEvent) => {
      // markers sit above the canvas in the DOM, so their taps are never circle taps
      if (e.originalEvent.target !== map.getCanvas()) return;

      const { x, y } = e.point;
      const hits = map.queryRenderedFeatures(
        [
          [x - hitRadius, y - hitRadius],
          [x + hitRadius, y + hitRadius],
        ],
        { layers: [layerId] },
      );

      onclick(hits.length > 0 ? (hits[0].properties.circleId as string) : null);
    };

    const handleMouseEnter = () => (map.getCanvas().style.cursor = 'pointer');
    const handleMouseLeave = () => (map.getCanvas().style.cursor = '');

    map.on('click', handleClick);
    map.on('mouseenter', layerId, handleMouseEnter);
    map.on('mouseleave', layerId, handleMouseLeave);

    return () => {
      map.off('click', handleClick);
      map.off('mouseenter', layerId, handleMouseEnter);
      map.off('mouseleave', layerId, handleMouseLeave);
    };
  });
</script>
