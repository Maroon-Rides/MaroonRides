<script lang="ts">
  import favicon from '$lib/assets/favicon.svg';
  import MapElements from '$lib/components/MapElements.svelte';
  import ThemeWatcher from '$lib/components/ThemeWatcher.svelte';
  import Map from '$lib/components/ui/map/Map.svelte';
  import MapControls from '$lib/components/ui/map/MapControls.svelte';
  import MapMarker from '$lib/components/ui/map/MapMarker.svelte';
  import MapRoute from '$lib/components/ui/map/MapRoute.svelte';
  import MarkerContent from '$lib/components/ui/map/MarkerContent.svelte';
  import { type Direction, type Route, type Stop } from '$lib/data/types';
  import { mapManager } from '$lib/managers/map.manager.svelte';
  import { themeManager } from '$lib/managers/theme.manager.svelte';
  import { customFetch } from '$lib/utils/fetch';
  import { getRouteTint } from '$lib/utils/tints';
  import { getLighterColor } from '$lib/utils/utils';
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
  import './layout.css';

  let { children } = $props();

  const queryClient = new QueryClient();
  const routes = $derived(mapManager.drawnRoutes);

  window.fetch = customFetch(window.fetch);
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<svelte:window bind:innerHeight={mapManager.mapHeight} bind:innerWidth={mapManager.mapWidth} />

<ThemeWatcher />

<QueryClientProvider client={queryClient}>
  <div class="fixed inset-0 -z-10 h-screen w-screen">
    <Map
      options={{
        attributionControl: false,
        minZoom: 6,
      }}
      onload={(map) => mapManager.registerMap(map)}
    >
      <MapControls showCompass={true} />

      <MapElements>
        {#snippet routeLine(route: Route)}
          {#each route.directions as direction (direction.id)}
            <MapRoute
              coordinates={direction.pathPoints.map((point) => [point.longitude, point.latitude])}
              color={getRouteTint(route, themeManager.theme)}
              id={`${direction.id}`}
              opacity={1}
              width={4}
            />
          {/each}
        {/snippet}

        {#snippet bus()}{/snippet}

        {#snippet stopMarker(route: Route, direction: Direction, stop: Stop)}
          {@const tint = getRouteTint(route, themeManager.theme)}
          {@const borderTint = getLighterColor(tint)}
          <MapMarker longitude={stop.location.longitude} latitude={stop.location.latitude}>
            <MarkerContent>
              <div
                class="size-4 rounded-full border-2 shadow-lg"
                style="border-color: {borderTint}; background-color: {tint}"
              ></div>
            </MarkerContent>
          </MapMarker>
        {/snippet}
      </MapElements>
    </Map>
  </div>

  <div class="pointer-events-none fixed inset-0 z-10 flex items-end select-none md:p-4">
    {@render children()}
  </div>
</QueryClientProvider>
