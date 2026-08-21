<script lang="ts">
  import { themeManager } from '$lib/managers/theme.manager.svelte';
  import { debounce } from 'lodash-es';
  import MapLibreGL from 'maplibre-gl';
  import 'maplibre-gl/dist/maplibre-gl.css';
  import { PMTiles, Protocol } from 'pmtiles';
  import { onDestroy, onMount, setContext, untrack } from 'svelte';
  import Spinner from '../spinner/spinner.svelte';

  type MapStyleOption = string | MapLibreGL.StyleSpecification;

  interface Props {
    children?: import('svelte').Snippet;
    styles?: {
      light?: MapStyleOption;
      dark?: MapStyleOption;
    };
    theme?: 'light' | 'dark';
    /** Map projection type. Use `{ type: "globe" }` for 3D globe view. */
    projection?: MapLibreGL.ProjectionSpecification;
    center?: [number, number];
    zoom?: number;
    options?: Omit<MapLibreGL.MapOptions, 'container' | 'style'>;
    onload?: (map: MapLibreGL.Map) => void;
  }

  const defaultStyles = {
    dark: '/map/dark.json',
    light: '/map/light.json',
  };

  let {
    children,
    styles,
    theme: _theme = 'light',
    projection,
    options = {},
    onload,
  }: Props = $props();

  let mapContainer: HTMLDivElement;
  let map: MapLibreGL.Map | null = $state(null);
  let bounds: MapLibreGL.LngLatBounds | null = $state(null);
  let isMounted = $state(false);
  let isLoaded = $state(false);
  let isStyleLoaded = $state(false);
  let appliedStyle: MapStyleOption | null = null;
  let cancelStyleLoad: (() => void) | null = null;

  const STYLE_LOAD_DEBOUNCE_MS = 50;

  const mapStyles = $derived({
    dark: styles?.dark ?? defaultStyles.dark,
    light: styles?.light ?? defaultStyles.light,
  });

  const currentStyle = $derived(themeManager.theme === 'light' ? mapStyles.light : mapStyles.dark);

  const isReady = $derived(isMounted && isLoaded && isStyleLoaded);

  export type MapContext = {
    getMap: () => MapLibreGL.Map | null;
    getBounds: () => MapLibreGL.LngLatBounds | null;
    isLoaded: () => boolean;
  };

  setContext<MapContext>('map', {
    getMap: () => map,
    getBounds: () => bounds,
    isLoaded: () => isReady,
  });

  onMount(async () => {
    isMounted = true;

    const protocol = new Protocol();
    MapLibreGL.addProtocol('pmtiles', protocol.tile);

    const PMTILE_URL = '/map/cstat.pmtiles';

    const p = new PMTiles(PMTILE_URL);

    // this is so we share one instance across the JS code and the map renderer
    protocol.add(p);

    const h = await p.getHeader();

    bounds = new MapLibreGL.LngLatBounds([h.minLon, h.minLat], [h.maxLon, h.maxLat]);

    appliedStyle = currentStyle;

    const mapInstance = new MapLibreGL.Map({
      container: mapContainer,
      style: appliedStyle,
      renderWorldCopies: false,
      // TODO move attribution elsewhere
      attributionControl: false,
      maxBounds: bounds,
      center: [h.centerLon, h.centerLat],
      zoom: h.maxZoom - 2,
      maxZoom: h.maxZoom + 2,
      minZoom: h.minZoom,
      // Cap pixel ratio at 2x for performance
      pixelRatio: Math.min(window.devicePixelRatio, 1.5),
      ...options,
    });

    const styleDataHandler = debounce(() => {
      isStyleLoaded = true;
      if (projection) {
        mapInstance.setProjection(projection);
      }
    }, STYLE_LOAD_DEBOUNCE_MS);

    cancelStyleLoad = styleDataHandler.cancel;

    const loadHandler = () => {
      isLoaded = true;
      if (map) {
        onload?.(map);
      }
    };

    mapInstance.on('load', loadHandler);
    mapInstance.on('styledata', styleDataHandler);

    map = mapInstance;
  });

  $effect(() => {
    const style = currentStyle;

    if (!map || !isLoaded || style === appliedStyle) {
      return;
    }

    untrack(() => {
      isStyleLoaded = false;
      appliedStyle = style;
      // Diff mode helps reuse existing layers for better performance
      map!.setStyle(style, { diff: false }); // Changed to false - full style reload is more reliable for theme changes
    });
  });

  onDestroy(() => {
    cancelStyleLoad?.();
    cancelStyleLoad = null;
    map?.remove();
    map = null;
    bounds = null;
    isLoaded = false;
    isStyleLoaded = false;
  });
</script>

<div bind:this={mapContainer} class="relative h-full w-full">
  {#if !isReady}
    <div class="absolute inset-0 flex items-center justify-center">
      <Spinner class="size-8" />
    </div>
  {:else}
    {@render children?.()}
  {/if}
</div>
