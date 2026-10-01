<script lang="ts">
  import EstimateRow from './EstimateRow.svelte';

  import { goto } from '$app/navigation';
  import type { BottomSheetContext } from '$lib/components/ui/bottom-sheet/sheet.svelte';
  import TimepointAttribute from '$lib/components/TimepointAttribute.svelte';
  import Button from '$lib/components/ui/button/button.svelte';
  import { mapManager } from '$lib/managers/map.manager.svelte';
  import { useStopEstimate } from '$lib/data/app';
  import {
    Amenity,
    ESTIMATES_UNAVAILABLE_MESSAGE,
    EstimateSource,
    type Direction,
    type Route,
    type Stop,
  } from '$lib/data/types';
  import { LiveDataStatus, liveDataManager } from '$lib/managers/live-data.manager.svelte';
  import { CalendarIcon } from '@lucide/svelte';
  import { getContext } from 'svelte';

  type Props = {
    stop: Stop;
    route: Route;
    direction: Direction;
    estimateDirection?: Direction;
    estimateStop?: Stop;
  };

  let { stop, route, direction, estimateDirection, estimateStop }: Props = $props();

  const sheet = getContext<BottomSheetContext>('bottom-sheet');

  const effectiveDirection = $derived(estimateDirection ?? direction);
  const effectiveStop = $derived(estimateStop ?? stop);

  const stopEstimates = $derived(
    useStopEstimate(() => ({
      direction: effectiveDirection,
      stop: effectiveStop,
    })),
  );

  let subtitle = $derived.by(() => {
    const source = stopEstimates.data?.source ?? EstimateSource.LOADING;
    const estimates = stopEstimates.data?.estimates ?? [];

    if (source === EstimateSource.LOADING) {
      return 'Loading departures';
    }
    if (source === EstimateSource.UNAVAILABLE) {
      return ESTIMATES_UNAVAILABLE_MESSAGE;
    }
    if (estimates.length === 0) {
      return 'No upcoming departures';
    }
    if (source === EstimateSource.SCHEDULE) {
      return liveDataManager.status === LiveDataStatus.OFFLINE
        ? 'Offline, showing scheduled times'
        : 'Scheduled times';
    }

    const firstEstimate = estimates.find((estimate) => estimate.estimatedTime);
    if (!firstEstimate?.estimatedTime) {
      return 'On time';
    }

    const deviationMinutes = Math.round(
      firstEstimate.estimatedTime.diff(firstEstimate.scheduledTime, 'minutes'),
    );

    if (deviationMinutes === 0) {
      return 'On time';
    } else if (deviationMinutes > 0) {
      return `${deviationMinutes} min late`;
    } else {
      return `${Math.abs(deviationMinutes)} min early`;
    }
  });
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
      <EstimateRow {route} direction={effectiveDirection} stop={effectiveStop} />
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
