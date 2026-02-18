<script lang="ts">
  import { useRoutes, useVehicles } from '$lib/data/app';
  import { type Bus, type Direction, type Location, type Route, type Stop } from '$lib/data/types';
  import { mapManager } from '$lib/managers/map.manager.svelte';
  import { themeManager } from '$lib/managers/theme.manager.svelte';
  import { getRouteTint } from '$lib/utils/tints';
  import { Geolocation } from '@capacitor/geolocation';
  import { onMount } from 'svelte';
  import MapMarker from '../ui/map/MapMarker.svelte';
  import MapRoute from '../ui/map/MapRoute.svelte';
  import MarkerContent from '../ui/map/MarkerContent.svelte';
  import BusMarker from './marker/BusMarker.svelte';
  import StopMarker from './marker/StopMarker.svelte';
  import BusPopup from './popup/BusPopup.svelte';
  import StopPopup from './popup/StopPopup.svelte';

  const routes = useRoutes();
  const drawnRouteIds = $derived(mapManager.drawnRoutes.map((route) => route.id));
  const busLocations = $derived(useVehicles(() => ({ route: mapManager.selectedRoute })));

  let userLocation: Location | null = $state(null);

  onMount(() => {
    const location = Geolocation.getCurrentPosition().then(
      (location) => (userLocation = location.coords),
    );

    const userLocationInteval = setInterval(async () => {
      const location = await Geolocation.getCurrentPosition();
      userLocation = location.coords;
    }, 5000);

    return () => {
      clearInterval(userLocationInteval);
    };
  });
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
  {@const isSelected =
    bus.direction.id === mapManager.selectedDirectionId || mapManager.selectedDirectionId == ''}
  <MapMarker longitude={bus.location.longitude} latitude={bus.location.latitude}>
    <BusPopup {bus} />
    <BusMarker {bus} {isSelected} />
  </MapMarker>
{/snippet}

{#snippet stopMarker(route: Route, direction: Direction, stop: Stop)}
  {@const isSelected =
    direction.id === mapManager.selectedDirectionId || mapManager.selectedDirectionId == ''}

  <MapMarker longitude={stop.location.longitude} latitude={stop.location.latitude}>
    <StopMarker {stop} {route} {isSelected} />
    <StopPopup {stop} {route} {direction} />
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

{#if userLocation}
  <MapMarker longitude={userLocation.longitude} latitude={userLocation.latitude}>
    <MarkerContent>
      <div
        class="relative flex size-5 items-center justify-center rounded-full border-4 bg-white shadow-lg"
      >
        <div
          class="pulse-animation h-full w-full rounded-full bg-blue-400 will-change-transform"
        ></div>
      </div>
    </MarkerContent>
  </MapMarker>
{/if}

<style>
  .pulse-animation {
    animation: pulse-scale 4.5s ease-in-out infinite;
  }

  @keyframes pulse-scale {
    0%,
    100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.15);
    }
  }
</style>
