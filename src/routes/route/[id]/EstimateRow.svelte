<script lang="ts">
  import TimeBubble from '$lib/components/TimeBubble.svelte';
  import Spinner from '$lib/components/ui/spinner/spinner.svelte';
  import { useStopEstimate } from '$lib/data/app';
  import type { Direction, Route, Stop } from '$lib/data/types';
  import { themeManager } from '$lib/managers/theme.manager.svelte';
  import { getRouteTint } from '$lib/utils/tints';

  type Props = {
    route: Route;
    direction: Direction;
    stop: Stop;
  };

  let { route, direction, stop }: Props = $props();

  const { data: estimates, isLoading } = $derived(
    useStopEstimate(() => ({
      route: route,
      direction: direction,
      stop,
    })),
  );
</script>

<div class="flex items-center gap-1" style="--tint: {getRouteTint(route, themeManager.theme)}">
  {#if isLoading}
    <Spinner class="size-4 self-center" />
  {:else if estimates?.length === 0}
    <p class="text-center text-sm text-muted-foreground">No upcoming departures</p>
  {/if}

  {#each estimates as estimate, i}
    <TimeBubble {estimate} isNext={i === 0} class="text-white" />
  {/each}
</div>
