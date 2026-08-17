<script lang="ts">
  import favicon from '$lib/assets/favicon.svg';
  import MapElements from '$lib/components/map/MapElements.svelte';
  import PlanMapElements from '$lib/components/map/PlanMapElements.svelte';
  import ThemeWatcher from '$lib/components/ThemeWatcher.svelte';
  import Map from '$lib/components/ui/map/Map.svelte';
  import MapControls from '$lib/components/ui/map/MapControls.svelte';
  import { mapManager } from '$lib/managers/map.manager.svelte';
  import { installInterceptor } from '$lib/utils/interceptor';
  import { migratePrefs } from '$lib/utils/prefs';
  import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
  import { onDestroy, onMount } from 'svelte';
  import './layout.css';
  import { connectivityManager } from '$lib/managers/connectivity.manager.svelte';
  import ConnectionPill from '$lib/components/ConnectionPill.svelte';

  let { children } = $props();

  const queryClient = new QueryClient({
    defaultOptions: { queries: { networkMode: 'offlineFirst' } },
    queryCache: new QueryCache({
      onError: (error, query) => connectivityManager.reportQueryError(error, query),
      onSuccess: (data, query) => connectivityManager.reportQuerySuccess(data, query),
    }),
  });

  onDestroy(() => {
    mapManager.unregisterMap();
  });

  onMount(async () => {
    connectivityManager.shareQueryClient(queryClient);

    migratePrefs();
  });

  installInterceptor();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<svelte:window bind:innerHeight={mapManager.mapHeight} bind:innerWidth={mapManager.mapWidth} />

<ThemeWatcher />

<QueryClientProvider client={queryClient}>
  <ConnectionPill initialHideTime={1500} />
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
      <PlanMapElements />
    </Map>
  </div>

  <div class="pointer-events-none fixed inset-0 z-10 flex items-end select-none md:p-4">
    {@render children()}
  </div>
</QueryClientProvider>
