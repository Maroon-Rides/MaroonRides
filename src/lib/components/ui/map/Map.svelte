<script lang="ts">
  import { browser } from '$app/environment';
  import MapLibreGL from 'maplibre-gl';
  import 'maplibre-gl/dist/maplibre-gl.css';
  import { PMTiles, Protocol } from 'pmtiles';
  import { onDestroy, onMount, setContext, untrack } from 'svelte';
  import Spinner from '../spinner/spinner.svelte';

  let tailwindTheme: 'light' | 'dark' = $state('light');

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
  }

  const defaultStyles = {
    dark: '/map/dark.json',
    light: '/map/light.json',
  };

  let { children, styles, theme: _theme = 'light', projection, options = {} }: Props = $props();

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

  const currentStyle = $derived(tailwindTheme === 'light' ? mapStyles.light : mapStyles.dark);

  const isReady = $derived(isMounted && isLoaded && isStyleLoaded);

  setContext('map', {
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

    if (browser) {
      const root = document.documentElement;

      const updateTheme = () => {
        tailwindTheme = root.classList.contains('dark') ? 'dark' : 'light';
      };

      updateTheme();

      const observer = new MutationObserver(updateTheme);
      observer.observe(root, {
        attributes: true,
        attributeFilter: ['class'],
      });

      onDestroy(() => observer.disconnect());
    }

    const protocol = new Protocol();
    MapLibreGL.addProtocol('pmtiles', protocol.tile);

    const PMTILE_URL = '/map/cstat_16.pmtiles';

    const p = new PMTiles(PMTILE_URL);

    // this is so we share one instance across the JS code and the map renderer
    protocol.add(p);

    const h = await p.getHeader();

    const mapInstance = new MapLibreGL.Map({
      container: mapContainer,
      style: currentStyle,
      renderWorldCopies: false,
      attributionControl: {
        compact: true,
      },
      maxBounds: [
        [h.minLon, h.minLat],
        [h.maxLon, h.maxLat],
      ],
      center: [h.centerLon, h.centerLat],
      zoom: h.maxZoom - 2,
      ...options,
    });

    const styleDataHandler = () => {
      clearStyleTimeout();
      // Delay to ensure style is fully processed before allowing layer operations
      // This is a workaround to avoid race conditions with the style loading
      // else we have to force update every layer on setStyle change
      styleTimeoutId = setTimeout(() => {
        isStyleLoaded = true;
        if (!initialStyleApplied) {
          initialStyleApplied = true;
        }
        if (projection) {
          mapInstance.setProjection(projection);
        }
      }, 100);
    };

    const loadHandler = () => {
      isLoaded = true;
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
      map!.setStyle(style, { diff: true });
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
