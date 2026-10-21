<script lang="ts">
  import EstimateRow from './EstimateRow.svelte';

  import { goto } from '$app/navigation';
  import type { BottomSheetContext } from '$lib/components/ui/bottom-sheet/sheet.svelte';
  import TimepointAttribute from '$lib/components/TimepointAttribute.svelte';
  import Button from '$lib/components/ui/button/button.svelte';
  import { mapManager } from '$lib/managers/map.manager.svelte';
  import { useStopEstimate } from '$lib/data/app';
  import { estimateStatusMessage } from '$lib/data/stop_estimates';
  import { Amenity, type Direction, type Route, type Stop } from '$lib/data/types';
  import { liveDataManager } from '$lib/managers/live-data.manager.svelte';
  import { CalendarIcon } from '@lucide/svelte';
  import { getContext } from 'svelte';

  type Props = {
    stop: Stop;
    route: Route;
    direction: Direction;
    estimateStop?: Stop;
  };

  let { stop, route, direction, estimateStop }: Props = $props();

  const sheet = getContext<BottomSheetContext>('bottom-sheet');

  const effectiveStop = $derived(estimateStop ?? stop);

  const stopEstimates = useStopEstimate(() => ({ stop: effectiveStop }));
  const subtitle = $derived(estimateStatusMessage(stopEstimates.data, liveDataManager.isOffline));
</script>

<div class="px-4 py-2">
  <div class="flex items-start justify-between">
    <div class="flex flex-col gap-1">
      <button
        type="button"
        class="text-left text-2xl font-bold"
        onclick={() => {
          mapManager.zoomToStop(stop);
          sheet.collapse();
        }}
      >
        {stop.name}
      </button>
      <p class="text-sm text-muted-foreground">{subtitle}</p>
    </div>

    <div class="mt-1 flex items-center gap-2">
      {#if stop.isTimepoint}
        <TimepointAttribute />
      {/if}
      {#each stop.amenities as amenity}
        {#if amenity !== Amenity.TIME_POINT}
          {@const AmenityIcon = Amenity.getIcon(amenity)}
          <AmenityIcon class="size-6 text-muted-foreground" />
        {/if}
      {/each}
    </div>
  </div>
  <div class="mt-2 flex items-center justify-between">
    {#if route && direction}
      <EstimateRow {route} estimates={stopEstimates.data} />
    {/if}
    <Button
      variant="outline"
      size="sm"
      class="rounded-full"
      onclick={() => {
        goto(`/route/${route?.id}/timetable/${stop.id}/${direction?.id}`);
      }}
    >
      <CalendarIcon class="size-4" />
    </Button>
  </div>
</div>
