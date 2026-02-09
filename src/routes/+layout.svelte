<script lang="ts">
  import favicon from '$lib/assets/favicon.svg';
  import Map from '$lib/components/ui/map/Map.svelte';
  import MapControls from '$lib/components/ui/map/MapControls.svelte';
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
    >
      <MapControls showCompass={true} />
    </Map>
  </div>

  <div class="pointer-events-none fixed inset-0 flex items-end select-none md:p-4">
    {@render children()}
  </div>
</QueryClientProvider>
