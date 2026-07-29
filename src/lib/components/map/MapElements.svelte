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
  import { goto } from '$app/navigation';

  const routes = useRoutes();
  const drawnRouteIds = $derived(mapManager.drawnRoutes.map((route) => route.id));
  const busLocations = $derived(useVehicles(() => ({ route: mapManager.selectedRoute })));

  let userLocation: Location | null = $state(null);

  onMount(() => {
    Geolocation.getCurrentPosition({ enableHighAccuracy: true })
      .then((location) => (userLocation = location.coords))
      .catch((error) => {
        console.error('Error requesting location permissions:', error);
      });

    const userLocationInteval = setInterval(async () => {
      try {
        const location = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
        userLocation = location.coords;
      } catch (error) {
        console.error('Error requesting location permissions:', error);
      }
    }, 5000);

    return () => {
      clearInterval(userLocationInteval);
    };
  });

  // originally stopped calls from stacked routes, but using this system
  // now to respect visual order when tapping a route
  let requestedRoutes: Array<{ route: Route; index: number }> = [];
  let flushScheduled = false;

  function requestRoute(route: Route, index: number) {
    requestedRoutes.push({ route, index });
    if (flushScheduled) return;
    flushScheduled = true;
    //fires after the onclick()s dispatch
    queueMicrotask(finalizeRoute);
  }
  function finalizeRoute() {
    flushScheduled = false;
    const topmost = requestedRoutes.reduce((a, b) => (b.index > a.index ? b : a)).route;
    requestedRoutes.length = 0; //cursed
    goto(`/route/${topmost.id}`);
  }
</script>

{#snippet routeLine(route: Route, index: number)}
  {#each route.directions as direction (`${route.id}-${direction.id}`)}
    {@const isSelected =
      direction.id === mapManager.selectedDirectionId || mapManager.selectedDirectionId == ''}
    {@const isShown = drawnRouteIds.includes(route.id)}
    {@const opacity = isShown ? (isSelected ? 1 : 0.5) : 0}

    <MapRoute
      coordinates={direction.pathPoints.map((point) => [point.longitude, point.latitude])}
      color={getRouteTint(route, themeManager.theme)}
      id={`${route.id}-${direction.id}`}
      onclick={() => {
        if (!isSelected) return; //opacity check instead of isShown for ghost directional routes
        requestRoute(route, index);
      }}
      interactive={isShown}
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

{#each routes?.data as route, i (route.id)}
  {@render routeLine(route, i)}
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
