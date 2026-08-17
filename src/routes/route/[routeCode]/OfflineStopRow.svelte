<script lang="ts">
  import Button from '$lib/components/ui/button/button.svelte';
  import { mapManager } from '$lib/managers/map.manager.svelte';
  import { type Direction, type Route, type Stop } from '$lib/data/types';
  import { CalendarIcon } from '@lucide/svelte';
  import { ConnectionStatus, connectivityManager } from '$lib/managers/connectivity.manager.svelte';
  import { Spinner } from '$lib/components/ui/spinner';

  type Props = {
    stop: Stop;
    route: Route;
    direction: Direction;
    estimateDirection?: Direction;
    estimateStop?: Stop;
  };
  const conStatus = $derived.by(connectivityManager.getConnectionStatus);
  const isLoading = $derived(
    conStatus === ConnectionStatus.CONNECTING || conStatus === ConnectionStatus.RECONNECTING,
  );
  const isOffline = $derived(conStatus === ConnectionStatus.OFFLINE);

  let { stop, route, direction, estimateDirection, estimateStop }: Props = $props();
  let subtitle = $derived(isOffline ? 'Depatures unavailable offline' : 'No upcoming departures');
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
      <!-- undef = initial query hasn't been made -> still loading -->
      <p class="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  </div>
  <div class="mt-2 flex items-center justify-between">
    <!-- fake button to keep heights consistent -->
    <div class="flex flex-1">
      {#if isLoading}<Spinner class="size-4 self-center" />{/if}
    </div>
    <Button variant="outline" size="sm" class="rounded-full" disabled={true}>
      <CalendarIcon class="size-4" />
    </Button>
  </div>
</div>
