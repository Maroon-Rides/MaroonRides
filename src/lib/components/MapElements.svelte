<script lang="ts">
  import type { Bus, Route, Stop } from '$lib/data/types';
  import { mapManager } from '$lib/managers/map.manager.svelte';
  import type { Snippet } from 'svelte';

  type Props = {
    bus: Snippet<[Bus]>;
    routeLine: Snippet<[Route]>;
    stopMarker: Snippet<[Stop]>;
  };

  let { bus, routeLine, stopMarker }: Props = $props();
</script>

<!-- {#each mapManager.d as busData (busData.id)} -->
<!-- {@render bus(busData)} -->
<!-- {/each} -->

{#each mapManager.drawnRoutes as route (route.id)}
  {@render routeLine(route)}
{/each}

<!-- {#each stopMarker() as stopData (stopData.id)} -->
<!-- {@render stopMarker(stopData)} -->
<!-- {/each} -->
