<script lang="ts">
  import type { Bus, Direction, Route, Stop } from '$lib/data/types';
  import { mapManager } from '$lib/managers/map.manager.svelte';
  import type { Snippet } from 'svelte';

  type Props = {
    bus: Snippet<[Bus]>;
    routeLine: Snippet<[Route]>;
    stopMarker: Snippet<[Route, Direction, Stop]>;
  };

  let { bus, routeLine, stopMarker }: Props = $props();
</script>

<!-- {#each mapManager.d as busData (busData.id)} -->
<!-- {@render bus(busData)} -->
<!-- {/each} -->

{#each mapManager.drawnRoutes as route (route.id)}
  {@render routeLine(route)}
{/each}

{#each mapManager.selectedRoute?.directions as direction (direction.id)}
  {#each direction.stops as stopData, i (stopData.id + '-' + direction.id + '-' + i)}
    {@render stopMarker(mapManager.selectedRoute!, direction, stopData)}
  {/each}
{/each}
