<script lang="ts">
  import RouteBubble from '$lib/components/RouteBubble.svelte';
  import TimeBubble from '$lib/components/TimeBubble.svelte';
  import MarkerPopup from '$lib/components/ui/map/MarkerPopup.svelte';
  import Spinner from '$lib/components/ui/spinner/spinner.svelte';
  import { useStopAmenities, useStopEstimate } from '$lib/data/app';
  import { Amenity, type Direction, type Route, type Stop } from '$lib/data/types';
  import { themeManager } from '$lib/managers/theme.manager.svelte';
  import { getRouteTint } from '$lib/utils/tints';

  type Props = {
    route: Route;
    stop: Stop;
    direction: Direction;
  };

  let { stop, route, direction }: Props = $props();

  const tint = $derived(getRouteTint(route, themeManager.theme));

  const { data: amenities } = $derived(useStopAmenities(() => ({ route, direction, stop })));
  const { data: estimates, isLoading } = $derived(
    useStopEstimate(() => ({ route, direction, stop })),
  );
</script>

<MarkerPopup class="flex flex-col gap-2 rounded-xl p-3">
  <div class="flex items-center justify-between gap-2">
    <div class="flex items-center gap-2 rounded-md pe-2">
      <RouteBubble type={'calloutIcon'} {route} />
      <span class="wrap line-clamp-2 max-w-24 text-sm leading-4 font-bold">{stop.name}</span>
    </div>

    <div class="flex items-center gap-2">
      {#each amenities as amenity}
        {@const AmenityIcon = Amenity.getIcon(amenity)}
        <AmenityIcon class="size-5" />
      {/each}
    </div>
  </div>

  <div class="flex items-center justify-center gap-1" style="--tint: {tint}">
    {#if isLoading}
      <Spinner class="size-4 self-center" />
    {:else if estimates?.length === 0}
      <p class="text-center text-xs text-muted-foreground">No upcoming departures</p>
    {/if}

    {#each estimates as estimate, i}
      <TimeBubble {estimate} isNext={i === 0} type={'callout'} />
    {/each}
  </div>
</MarkerPopup>
