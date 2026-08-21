<script lang="ts">
  import { goto } from '$app/navigation';
  import {
    circleLayerId,
    type MapCircle,
    type MapCircleStyle,
  } from '$lib/components/ui/map/MapCircleLayer.svelte';
  import { useRoutes, useVehicles } from '$lib/data/app';
  import { type Bus, type Location, type Route, type Stop } from '$lib/data/types';
  import { mapManager } from '$lib/managers/map.manager.svelte';
  import { themeManager } from '$lib/managers/theme.manager.svelte';
  import { getRouteTint } from '$lib/utils/tints';
  import { getLighterColor } from '$lib/utils/utils';
  import { Geolocation } from '@capacitor/geolocation';
  import { uniqBy } from 'lodash-es';
  import { onMount } from 'svelte';
  import MapCircleLayer from '../ui/map/MapCircleLayer.svelte';
  import MapMarker from '../ui/map/MapMarker.svelte';
  import MapRoute from '../ui/map/MapRoute.svelte';
  import MarkerContent from '../ui/map/MarkerContent.svelte';
  import BusMarker from './marker/BusMarker.svelte';
  import BusPopup from './popup/BusPopup.svelte';
  import StopPopup from './popup/StopPopup.svelte';

  const STOPS_ID = 'stops';

  const routes = useRoutes();
  const busLocations = $derived(useVehicles(() => ({ route: mapManager.selectedRoute })));

  let userLocation: Location | null = $state(null);

  onMount(() => {
    let watchId: string | null = null;

    Geolocation.watchPosition({ enableHighAccuracy: true }, (location) => {
      if (location) userLocation = location.coords;
    })
      .then((id) => (watchId = id))
      .catch((error) => console.error('Error requesting location permissions:', error));

    return () => {
      if (watchId) Geolocation.clearWatch({ id: watchId });
    };
  });

  const drawnRouteIds = $derived(mapManager.drawnRoutes.map((route) => route.id));

  function isDirectionSelected(directionId: string) {
    return directionId === mapManager.selectedDirectionId || mapManager.selectedDirectionId === '';
  }

  // originally stopped calls from stacked routes, but using this system
  // now to respect visual order when tapping a route
  let requestedRoutes: Array<{ route: Route; index: number }> = [];
  let flushScheduled = false;
  let stopWasTapped = false;

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
    // the stop layer draws over the lines, so a tap that landed on a stop is not a route tap
    if (!stopWasTapped) goto(`/route/${topmost.id}`);
  }

  function markStopTapped() {
    stopWasTapped = true;
    queueMicrotask(() => (stopWasTapped = false));
  }

  const stopsByDirection = $derived(
    (mapManager.selectedRoute?.directions ?? []).map((direction) => ({
      direction,
      stops: uniqBy(direction.stops, 'id'),
    })),
  );

  const stopCircles = $derived(
    stopsByDirection.flatMap(({ direction, stops }) =>
      stops.map(
        (stop): MapCircle => ({
          id: `${direction.id}-${stop.id}`,
          longitude: stop.location.longitude,
          latitude: stop.location.latitude,
        }),
      ),
    ),
  );

  const stopCircleStyles = $derived.by(() => {
    const route = mapManager.selectedRoute;
    if (!route) return {};

    const color = getRouteTint(route, themeManager.theme);
    const strokeColor = getLighterColor(color);

    return Object.fromEntries(
      stopsByDirection.flatMap(({ direction, stops }) => {
        const opacity = isDirectionSelected(direction.id) ? 1 : 0.5;
        return stops.map((stop): [string, MapCircleStyle] => [
          `${direction.id}-${stop.id}`,
          { color, strokeColor, opacity },
        ]);
      }),
    );
  });

  const stopsByCircleId = $derived(
    new Map<string, Stop>(
      stopsByDirection.flatMap(({ direction, stops }) =>
        stops.map((stop) => [`${direction.id}-${stop.id}`, stop] as const),
      ),
    ),
  );

  const selectedStop = $derived.by(() => {
    const route = mapManager.selectedRoute;
    if (!route || !mapManager.selectedStopId) return null;

    for (const { direction, stops } of stopsByDirection) {
      if (!isDirectionSelected(direction.id)) continue;

      const stop = stops.find((candidate) => candidate.id === mapManager.selectedStopId);
      if (stop) return { route, direction, stop };
    }

    return null;
  });
</script>

{#snippet routeLine(route: Route, index: number)}
  {#each route.directions as direction (`${route.id}-${direction.id}`)}
    {@const isSelected = isDirectionSelected(direction.id)}
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
      beforeId={circleLayerId(STOPS_ID)}
      {opacity}
      width={5}
    />
  {/each}
{/snippet}

{#snippet busMarker(bus: Bus)}
  <MapMarker longitude={bus.location.longitude} latitude={bus.location.latitude} zIndex={20}>
    <BusPopup {bus} />
    <BusMarker {bus} isSelected={isDirectionSelected(bus.direction.id)} />
  </MapMarker>
{/snippet}

{#each routes?.data ?? [] as route, i (route.id)}
  {@render routeLine(route, i)}
{/each}

<MapCircleLayer
  id={STOPS_ID}
  circles={stopCircles}
  styles={stopCircleStyles}
  onclick={(id) => {
    const stopId = (id && stopsByCircleId.get(id)?.id) || null;
    if (stopId) markStopTapped();
    mapManager.selectedStopId = stopId === mapManager.selectedStopId ? null : stopId;
  }}
/>

{#if selectedStop}
  <StopPopup
    route={selectedStop.route}
    direction={selectedStop.direction}
    stop={selectedStop.stop}
    onclose={() => (mapManager.selectedStopId = null)}
  />
{/if}

{#each busLocations?.data ?? [] as bus (bus.id)}
  {@render busMarker(bus)}
{/each}

{#if userLocation}
  <MapMarker longitude={userLocation.longitude} latitude={userLocation.latitude} zIndex={30}>
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
