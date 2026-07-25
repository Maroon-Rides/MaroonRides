<script lang="ts">
  import { themeManager } from '$lib/managers/theme.manager.svelte';
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
  let isMounted = $state(false);
  let isLoaded = $state(false);
  let isStyleLoaded = $state(false);
  let initialStyleApplied = false;
  let styleTimeoutId: ReturnType<typeof setTimeout> | null = null;

  const mapStyles = $derived({
    dark: styles?.dark ?? defaultStyles.dark,
    light: styles?.light ?? defaultStyles.light,
  });

  const currentStyle = $derived(themeManager.theme === 'light' ? mapStyles.light : mapStyles.dark);

  const isReady = $derived(isMounted && isLoaded && isStyleLoaded);

  export type MapContext = {
    getMap: () => MapLibreGL.Map | null;
    isLoaded: () => boolean;
  };

  setContext<MapContext>('map', {
    getMap: () => map,
    isLoaded: () => isReady,
  });

  function clearStyleTimeout() {
    if (styleTimeoutId) {
      clearTimeout(styleTimeoutId);
      styleTimeoutId = null;
    }
  }

  onMount(async () => {
    isMounted = true;

    const protocol = new Protocol();
    MapLibreGL.addProtocol('pmtiles', protocol.tile);

    const PMTILE_URL = '/map/cstat.pmtiles';

    const p = new PMTiles(PMTILE_URL);

    // this is so we share one instance across the JS code and the map renderer
    protocol.add(p);

    const h = await p.getHeader();

    const mapInstance = new MapLibreGL.Map({
      container: mapContainer,
      style: currentStyle,
      renderWorldCopies: false,
      // TODO move attribution elsewhere
      attributionControl: false,
      maxBounds: [
        [h.minLon, h.minLat],
        [h.maxLon, h.maxLat],
      ],
      center: [h.centerLon, h.centerLat],
      zoom: h.maxZoom - 2,
      maxZoom: h.maxZoom + 2,
      minZoom: h.minZoom,
      // Cap pixel ratio at 2x for performance
      pixelRatio: Math.min(window.devicePixelRatio, 1.5),
      ...options,
    });

    const styleDataHandler = () => {
      clearStyleTimeout();
      // Reduced timeout for faster responsiveness
      styleTimeoutId = setTimeout(() => {
        isStyleLoaded = true;
        if (!initialStyleApplied) {
          initialStyleApplied = true;
        }
        if (projection) {
          mapInstance.setProjection(projection);
        }
      }, 50); // Reduced from 100ms to 50ms
    };

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

    if (!map || !initialStyleApplied) {
      return;
    }

    untrack(() => {
      isStyleLoaded = false;
      // Diff mode helps reuse existing layers for better performance
      map!.setStyle(style, { diff: false }); // Changed to false - full style reload is more reliable for theme changes
    });
  });

  onDestroy(() => {
    map?.remove();
    map = null;
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
