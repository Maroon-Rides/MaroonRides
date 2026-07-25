<script lang="ts">
  import { mapManager } from '$lib/managers/map.manager.svelte';
  import { planManager } from '$lib/managers/plan.manager.svelte';
  import { themeManager } from '$lib/managers/theme.manager.svelte';
  import { processRoutePlanMapComponents } from '$lib/utils/route-planning';
  import { MapPin } from '@lucide/svelte';
  import { MapMarker, MarkerContent } from '../ui/map';
  import MapRoute from '../ui/map/MapRoute.svelte';

  const components = $derived(
    processRoutePlanMapComponents(planManager.selectedPlan, planManager.shownInstruction),
  );
  //decided not to add as method to theme manager
  const lineColor = $derived(themeManager.theme === 'light' ? '#007afe' : '#0a84ff');
  $effect(() => {
    const pts = components.highlighted;
    if (pts.length > 0) mapManager.zoomToFitPoints(pts);
    else if (components.markers.length > 0) mapManager.zoomToFitPoints(components.markers);
  });
</script>

{#if planManager.selectedPlan}
  {#if components.highlighted.length > 0}
    <MapRoute
      id="plan-highlighted"
      coordinates={components.highlighted.map((p) => [p.longitude, p.latitude])}
      color={lineColor}
      opacity={1}
      width={5}
    />
  {/if}

  {#each components.faded as fadedPath, i}
    {#if fadedPath.length > 0}
      <MapRoute
        id={`plan-faded-${i}`}
        coordinates={fadedPath.map((p) => [p.longitude, p.latitude])}
        color={lineColor}
        opacity={0.38}
        width={5}
      />
    {/if}
  {/each}

  {#each components.markers as marker}
    {#if marker.isOrigin}
      <MapMarker longitude={marker.longitude} latitude={marker.latitude}>
        <MarkerContent>
          <div
            class="size-4 rounded-full border-3 border-white"
            style="background:{lineColor}"
          ></div>
        </MarkerContent>
      </MapMarker>
    {:else}
      <MapMarker longitude={marker.longitude} latitude={marker.latitude} anchor="bottom">
        <MarkerContent>
          <MapPin
            class="size-8 fill-red-500 text-red-500 [&>circle]:fill-white [&>circle]:stroke-white"
          />
        </MarkerContent>
      </MapMarker>
    {/if}
  {/each}
{/if}
