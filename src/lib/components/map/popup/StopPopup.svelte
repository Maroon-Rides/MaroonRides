<script lang="ts">
  import RouteBubble from '$lib/components/RouteBubble.svelte';
  import MapPopup from '$lib/components/ui/map/MapPopup.svelte';
  import Spinner from '$lib/components/ui/spinner/spinner.svelte';
  import TimeBubble from '$lib/components/TimeBubble.svelte';
  import { useStopEstimate } from '$lib/data/app';
  import { estimateStatusMessage } from '$lib/data/stop_estimates';
  import { Amenity, EstimateSource, type Route, type Stop } from '$lib/data/types';
  import { liveDataManager } from '$lib/managers/live-data.manager.svelte';
  import { themeManager } from '$lib/managers/theme.manager.svelte';

  type Props = {
    route: Route;
    stop: Stop;
    onclose?: () => void;
  };

  let { stop, route, onclose }: Props = $props();

  const tint = $derived(themeManager.tintFor(route));

  const stopEstimates = useStopEstimate(() => ({ stop }));
  const estimates = $derived(stopEstimates.data.estimates);
</script>

<MapPopup
  longitude={stop.location.longitude}
  latitude={stop.location.latitude}
  anchor="bottom"
  offset={14}
  closeOnClick={false}
  class="flex flex-col gap-2 rounded-xl p-3"
  {onclose}
>
  <div class="flex items-center justify-between gap-2">
    <div class="flex items-center gap-2 rounded-md pe-2">
      <RouteBubble type={'calloutIcon'} {route} />
      <span class="wrap line-clamp-2 max-w-[7em] text-sm leading-4 font-bold">{stop.name}</span>
    </div>

    <div class="flex items-center gap-2">
      {#each stop.amenities as amenity}
        {#if amenity !== Amenity.TIME_POINT}
          {@const AmenityIcon = Amenity.getIcon(amenity)}
          <AmenityIcon class="size-6 text-muted-foreground" />
        {/if}
      {/each}
    </div>
  </div>

  <div class="flex items-center justify-center gap-1" style="--tint: {tint}">
    {#if stopEstimates.data.source === EstimateSource.LOADING}
      <Spinner class="size-4 self-center" />
    {:else if estimates.length === 0}
      <p class="text-center text-xs text-muted-foreground">
        {estimateStatusMessage(stopEstimates.data, liveDataManager.isOffline)}
      </p>
    {/if}

    {#each estimates as estimate, i}
      <TimeBubble {estimate} isNext={i === 0} type={'callout'} />
    {/each}
  </div>
</MapPopup>
