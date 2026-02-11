<script lang="ts">
  import favicon from '$lib/assets/favicon.svg';
  import MapElements from '$lib/components/MapElements.svelte';
  import ThemeWatcher from '$lib/components/ThemeWatcher.svelte';
  import Map from '$lib/components/ui/map/Map.svelte';
  import MapControls from '$lib/components/ui/map/MapControls.svelte';
  import { mapManager } from '$lib/managers/map.manager.svelte';
  import { customFetch } from '$lib/utils/fetch';
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
  import { onDestroy } from 'svelte';
  import './layout.css';

  let { children } = $props();

  const queryClient = new QueryClient();

  onDestroy(() => {
    mapManager.unregisterMap();
  });

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

      <MapElements />
    </Map>
  </div>

  <div class="pointer-events-none fixed inset-0 z-10 flex items-end select-none md:p-4">
    {@render children()}
  </div>
</QueryClientProvider>
