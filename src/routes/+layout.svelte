<script lang="ts">
  import favicon from '$lib/assets/favicon.svg';
  import MapElements from '$lib/components/map/MapElements.svelte';
  import PlanMapElements from '$lib/components/map/PlanMapElements.svelte';
  import Map from '$lib/components/ui/map/Map.svelte';
  import MapControls from '$lib/components/ui/map/MapControls.svelte';
  import { frontPageManager } from '$lib/managers/frontpage.manager.svelte';
  import { mapManager } from '$lib/managers/map.manager.svelte';
  import { installDynamicType } from '$lib/utils/dynamic-type';
  import { installInterceptor } from '$lib/utils/interceptor';
  import { migratePrefs } from '$lib/utils/prefs';
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
  import { ModeWatcher } from 'mode-watcher';
  import { onDestroy, onMount } from 'svelte';
  import './layout.css';

  let { children } = $props();

  const queryClient = new QueryClient();

  onDestroy(() => {
    mapManager.unregisterMap();
  });

  onMount(async () => {
    await migratePrefs(); //sync to reduce some ui flickering when states change
    await frontPageManager.load();
  });

  installInterceptor();
  installDynamicType();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<svelte:window bind:innerHeight={mapManager.mapHeight} bind:innerWidth={mapManager.mapWidth} />

<ModeWatcher disableTransitions={false} />

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
      <PlanMapElements />
    </Map>
  </div>

  <div class="pointer-events-none fixed inset-0 z-10 flex items-end select-none md:p-4">
    {@render children()}
  </div>
</QueryClientProvider>
