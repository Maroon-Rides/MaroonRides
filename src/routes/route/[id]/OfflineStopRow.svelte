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
  let subtitle = 'Depatures unavailable offline';
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
  </div>
  <div class="mt-2 flex items-center justify-between">
    <!-- fake button to keep heights consistent -->
    <div class="flex flex-1"></div>
    <Button variant="outline" size="sm" class="rounded-full" disabled={true}>
      <CalendarIcon class="size-4" />
    </Button>
  </div>
</div>
