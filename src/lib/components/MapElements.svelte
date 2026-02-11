<script lang="ts">
  import type { Direction, Route, Stop } from '$lib/data/types';
  import { mapManager } from '$lib/managers/map.manager.svelte';
  import { themeManager } from '$lib/managers/theme.manager.svelte';
  import { getRouteTint } from '$lib/utils/tints';
  import { getLighterColor } from '$lib/utils/utils';
  import MapMarker from './ui/map/MapMarker.svelte';
  import MapRoute from './ui/map/MapRoute.svelte';
  import MarkerContent from './ui/map/MarkerContent.svelte';
  import MarkerPopup from './ui/map/MarkerPopup.svelte';
</script>

{#snippet routeLine(route: Route)}
  {#each route.directions as direction (direction.id)}
    {@const isSelected =
      direction.id === mapManager.selectedDirectionId || mapManager.selectedDirectionId == ''}
    <MapRoute
      coordinates={direction.pathPoints.map((point) => [point.longitude, point.latitude])}
      color={getRouteTint(route, themeManager.theme)}
      id={`${direction.id}`}
      opacity={isSelected ? 1 : 0.5}
      width={5}
      onclick={() => (mapManager.selectedDirectionId = direction.id)}
    />
  {/each}
{/snippet}

{#snippet bus()}{/snippet}

{#snippet stopMarker(route: Route, direction: Direction, stop: Stop)}
  {@const tint = getRouteTint(route, themeManager.theme)}
  {@const borderTint = getLighterColor(tint)}
  {@const isSelected =
    direction.id === mapManager.selectedDirectionId || mapManager.selectedDirectionId == ''}
  {@const opacity = isSelected ? 1 : 0.5}
  <MapMarker longitude={stop.location.longitude} latitude={stop.location.latitude}>
    <MarkerContent>
      <!-- padding to increase touch target size -->
      <div class="p-3">
        <div
          class="size-4 rounded-full border-2 shadow-lg"
          style="border-color: {borderTint}; background-color: {tint}; opacity: {opacity}"
        ></div>
      </div>
    </MarkerContent>
    <MarkerPopup>
      <div class="flex flex-col">
        <span class="text-sm font-medium">{stop.name}</span>
        <span class="text-xs text-muted-foreground">
          {direction.name} - {route.name}
        </span>
      </div>
    </MarkerPopup>
  </MapMarker>
{/snippet}

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
