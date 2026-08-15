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
  import { Cloud, CloudOff } from '@lucide/svelte';
  import * as Card from '$lib/components/ui/card';
  import { fly } from 'svelte/transition';

  let { children } = $props();

  const queryClient = new QueryClient({
    defaultOptions: { queries: { networkMode: 'offlineFirst' } },
    queryCache: new QueryCache({
      onError: (error, query) => {
        if (query.meta?.network) connectivityManager.reportError(error);
        if (query.meta?.auth) connectivityManager.reportAuthError(error);
      },
      onSuccess: (data, query) => {
        if (query.meta?.network) connectivityManager.reportSuccess(data);
        if (query.meta?.auth) connectivityManager.reportAuthSuccess(data);
      },
    }),
  });
  $effect(() => {
    console.log(connectivityManager.apiError, connectivityManager.authError);
  });
  onDestroy(() => {
    mapManager.unregisterMap();
  });

  onMount(async () => {
    migratePrefs();
  });

  installInterceptor();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<svelte:window bind:innerHeight={mapManager.mapHeight} bind:innerWidth={mapManager.mapWidth} />

<ThemeWatcher />

<QueryClientProvider client={queryClient}>
  {#if connectivityManager.apiError || connectivityManager.authError}
    <div
      in:fly={{ y: -100, duration: 500, opacity: 1 }}
      out:fly={{
        y: -100,
        duration: 500,
        opacity: 1,
      }}
    >
      <Card.Root class="gap-1 rounded-t-none py-0.5 pb-2">
        <div class="flex flex-1 items-center justify-center gap-2">
          <CloudOff class="size-4" />
          <p>Offline</p>
        </div>
        <!-- fake grab bar -->
        <div class="flex w-full items-center justify-center">
          <div class="h-1 w-[8%] rounded-full bg-muted-foreground/20"></div>
        </div>
      </Card.Root>
    </div>
  {/if}
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
