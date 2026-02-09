<script lang="ts">
  import favicon from '$lib/assets/favicon.svg';
  import MapElements from '$lib/components/MapElements.svelte';
  import Map from '$lib/components/ui/map/Map.svelte';
  import MapControls from '$lib/components/ui/map/MapControls.svelte';
  import MapRoute from '$lib/components/ui/map/MapRoute.svelte';
  import { type Route } from '$lib/data/types';
  import { mapManager } from '$lib/managers/map.manager.svelte';
  import { customFetch } from '$lib/utils/fetch';
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
  import './layout.css';

  let { children } = $props();

  const queryClient = new QueryClient();

  window.fetch = customFetch(window.fetch);
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<QueryClientProvider client={queryClient}>
  <div class="fixed inset-0 -z-10 h-screen w-screen">
    <Map
      options={{
        attributionControl: false,
      }}
      onload={(map) => mapManager.registerMap(map)}
    >
      <MapControls showCompass={true} />

      <MapElements>
        {#snippet routeLine(route: Route)}
          {#each route.directions as direction (direction.id)}
            <MapRoute
              coordinates={direction.pathPoints.map((point) => [point.longitude, point.latitude])}
              color={route.tintColor}
              id={`${route.id}-${direction.id}`}
              width={4}
            />
          {/each}
        {/snippet}

        {#snippet bus()}{/snippet}

        {#snippet stopMarker()}{/snippet}
      </MapElements>
    </Map>
  </div>

  <div class="pointer-events-none fixed inset-0 z-10 flex items-end select-none md:p-4">
    {@render children()}
  </div>
</QueryClientProvider>
