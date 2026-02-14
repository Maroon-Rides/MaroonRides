<script lang="ts">
  import TimeBubble from './TimeBubble.svelte';

  import { useRoutes, useStopAmenities, useStopEstimate, useVehicles } from '$lib/data/app';
  import { Amenity, type Bus, type Direction, type Route, type Stop } from '$lib/data/types';
  import { mapManager } from '$lib/managers/map.manager.svelte';
  import { themeManager } from '$lib/managers/theme.manager.svelte';
  import { getRouteTint } from '$lib/utils/tints';
  import { getLighterColor } from '$lib/utils/utils';
  import { BusFrontIcon } from 'lucide-svelte';
  import RouteBubble from './RouteBubble.svelte';
  import MapMarker from './ui/map/MapMarker.svelte';
  import MapRoute from './ui/map/MapRoute.svelte';
  import MarkerContent from './ui/map/MarkerContent.svelte';
  import MarkerPopup from './ui/map/MarkerPopup.svelte';
  import Spinner from './ui/spinner/spinner.svelte';

  const routes = useRoutes();
  const drawnRouteIds = $derived(mapManager.drawnRoutes.map((route) => route.id));

  const busLocations = $derived(useVehicles(() => ({ route: mapManager.selectedRoute })));
</script>

{#snippet routeLine(route: Route)}
  {#each route.directions as direction (`${route.id}-${direction.id}`)}
    {@const isSelected =
      direction.id === mapManager.selectedDirectionId || mapManager.selectedDirectionId == ''}
    {@const isShown = drawnRouteIds.includes(route.id)}
    {@const opacity = isShown ? (isSelected ? 1 : 0.5) : 0}

    <MapRoute
      coordinates={direction.pathPoints.map((point) => [point.longitude, point.latitude])}
      color={getRouteTint(route, themeManager.theme)}
      id={`${route.id}-${direction.id}`}
      {opacity}
      width={5}
    />
  {/each}
{/snippet}

{#snippet busMarker(bus: Bus)}
  {@const tint = getRouteTint(bus.route, themeManager.theme)}
  {@const borderTint = getLighterColor(tint)}
  {@const isSelected =
    bus.route.id === mapManager.selectedRoute?.id || mapManager.selectedRoute == null}
  {@const opacity = isSelected ? 1 : 0.5}

  <MapMarker longitude={bus.location.longitude} latitude={bus.location.latitude}>
    <MarkerContent>
      <div
        class="z-10 flex size-8 items-center justify-center rounded-l-full rounded-tr-full border-2 shadow-lg"
        style="border-color: {borderTint}; background-color: {tint}; opacity: {opacity}; rotate: {bus.heading -
          135}deg"
      >
        <BusFrontIcon class="size-5 stroke-2 text-white" style="rotate: {-bus.heading - 225}deg" />
      </div>
    </MarkerContent>
    <MarkerPopup class="flex flex-col gap-3 rounded-xl p-3">
      <div class="flex items-center justify-between gap-10">
        <div class="flex items-center gap-2 rounded-md bg-muted pe-2">
          <RouteBubble type={'calloutIcon'} route={bus.route} />
          <span class="text-xs font-bold text-muted-foreground">{bus.name}</span>
        </div>

        <div class="flex items-center gap-2">
          {#each bus.amenities as amenity}
            {@const AmenityIcon = Amenity.getIcon(amenity)}
            <AmenityIcon class="size-6" />
          {/each}
        </div>
      </div>

      <div class="flex items-center justify-between">
        <span class="text-xs font-bold text-muted-foreground">{bus.capacity}% Full</span>
        <span class="text-xs font-bold text-muted-foreground">
          {Math.round(bus.speed)} MPH
        </span>
      </div>
    </MarkerPopup>
  </MapMarker>
{/snippet}

{#snippet stopMarker(route: Route, direction: Direction, stop: Stop)}
  {@const tint = getRouteTint(route, themeManager.theme)}
  {@const borderTint = getLighterColor(tint)}
  {@const isSelected =
    direction.id === mapManager.selectedDirectionId || mapManager.selectedDirectionId == ''}
  {@const opacity = isSelected ? 1 : 0.5}

  {@const { data: amenities } = useStopAmenities(() => ({ route, direction, stop }))}
  {@const { data: estimates, isLoading } = useStopEstimate(() => ({ route, direction, stop }))}

  <MapMarker longitude={stop.location.longitude} latitude={stop.location.latitude}>
    <MarkerContent>
      <!-- padding to increase touch target size -->
      <div class="p-3">
        <div
          class="z-5 size-4 rounded-full border-2 shadow-lg"
          style="border-color: {borderTint}; background-color: {tint}; opacity: {opacity}"
        ></div>
      </div>
    </MarkerContent>
    <MarkerPopup class="flex flex-col gap-2 rounded-xl p-3">
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2 rounded-md pe-2">
          <RouteBubble type={'calloutIcon'} {route} />
          <span class="wrap line-clamp-2 max-w-24 text-sm font-bold">{stop.name}</span>
        </div>

        <div class="flex items-center gap-2">
          {#each amenities as amenity}
            {@const AmenityIcon = Amenity.getIcon(amenity)}
            <AmenityIcon class="size-6" />
          {/each}
        </div>
      </div>

      <div class="flex items-center justify-center gap-1" style="--tint: {tint}">
        {#if isLoading}
          <Spinner class="size-4 self-center" />
        {:else if estimates?.length === 0}
          <p class="text-center text-sm text-muted-foreground">No upcoming departures</p>
        {/if}

        {#each estimates as estimate, i}
          <TimeBubble {estimate} isNext={i === 0} />
        {/each}
      </div>
    </MarkerPopup>
  </MapMarker>
{/snippet}

{#each routes?.data as route (route.id)}
  {@render routeLine(route)}
{/each}

{#each mapManager.selectedRoute?.directions as direction (direction.id)}
  {#each direction.stops as stopData, i (stopData.id + '-' + direction.id + '-' + i)}
    {@render stopMarker(mapManager.selectedRoute!, direction, stopData)}
  {/each}
{/each}

{#each busLocations?.data as bus (bus.id)}
  {@render busMarker(bus)}
{/each}
