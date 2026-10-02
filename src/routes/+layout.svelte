<script lang="ts">
  import favicon from '$lib/assets/favicon.svg';
  import MapElements from '$lib/components/map/MapElements.svelte';
  import PlanMapElements from '$lib/components/map/PlanMapElements.svelte';
  import UpdateRequired from '$lib/components/UpdateRequired.svelte';
  import Map from '$lib/components/ui/map/Map.svelte';
  import MapControls from '$lib/components/ui/map/MapControls.svelte';
  import { frontPageManager } from '$lib/managers/frontpage.manager.svelte';
  import { mapManager } from '$lib/managers/map.manager.svelte';
  import { liveDataManager } from '$lib/managers/live-data.manager.svelte';
  import { syncManager, VersionStatus } from '$lib/managers/sync.manager.svelte';
  import { installDynamicType } from '$lib/utils/dynamic-type';
  import { installInterceptor } from '$lib/utils/interceptor';
  import { migratePrefs } from '$lib/utils/prefs';
  import { queryClient } from '$lib/utils/queries';
  import { QueryClientProvider } from '@tanstack/svelte-query';
  import { page } from '$app/state';
  import { ModeWatcher } from 'mode-watcher';
  import { onDestroy, onMount } from 'svelte';
  import './layout.css';

  let { children } = $props();

  // Every page under /route/[id] shows live data for that route.
  $effect(() => liveDataManager.subscribe(page.params.id ?? null));

  onDestroy(() => {
    mapManager.unregisterMap();
  });

  onMount(async () => {
    // Pages read prefs on load, so migrating first keeps them from flickering.
    await migratePrefs();
    await frontPageManager.load();
    await syncManager.start();
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

{#if syncManager.versionStatus === VersionStatus.UNSUPPORTED}
  <UpdateRequired />
{/if}
