<script lang="ts">
  import EstimateRow from './EstimateRow.svelte';

  import { goto } from '$app/navigation';
  import Button from '$lib/components/ui/button/button.svelte';
  import { mapManager } from '$lib/managers/map.manager.svelte';
  import { useStopAmenities, useStopEstimate } from '$lib/data/app';
  import { Amenity, type Direction, type Route, type Stop } from '$lib/data/types';
  import { CalendarIcon } from '@lucide/svelte';

  type Props = {
    stop: Stop;
    route: Route;
    direction: Direction;
    estimateDirection?: Direction;
    estimateStop?: Stop;
  };

  let { stop, route, direction, estimateDirection, estimateStop }: Props = $props();

  const effectiveDirection = $derived(estimateDirection ?? direction);
  const effectiveStop = $derived(estimateStop ?? stop);

  const { data: estimates, isLoading } = $derived(
    useStopEstimate(() => ({
      route: route,
      direction: effectiveDirection,
      stop: effectiveStop,
    })),
  );

  const { data: stopAmenities } = useStopAmenities(() => ({ route, direction, stop }));

  let subtitle = $derived.by(() => {
    if (!estimates || estimates.length === 0) {
      return 'No upcoming departures';
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
        onclick={() => mapManager.zoomToStop(stop)}
      >
        {stop.name}
      </button>
      <p class="text-sm text-muted-foreground">{subtitle}</p>
    </div>

    <div class="mt-1 flex items-center gap-2">
      {#each stopAmenities as amenity}
        {@const AmenityIcon = Amenity.getIcon(amenity)}
        <AmenityIcon class="size-6 text-muted-foreground" />
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
