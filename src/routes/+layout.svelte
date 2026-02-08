<script lang="ts">
  import favicon from '$lib/assets/favicon.svg';
  import Map from '$lib/components/ui/map/Map.svelte';
  import MapControls from '$lib/components/ui/map/MapControls.svelte';
  import './layout.css';

  let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="fixed inset-0 -z-10 h-screen w-screen">
  <Map
    options={{
      attributionControl: false,
    }}
  >
    <MapControls showCompass={true} />
  </Map>
</div>

<div class="pointer-events-none fixed inset-0 select-none md:p-4">
  {@render children()}
</div>
