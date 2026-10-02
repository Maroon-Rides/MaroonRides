<script lang="ts">
  import TimeBubble from '$lib/components/TimeBubble.svelte';
  import Spinner from '$lib/components/ui/spinner/spinner.svelte';
  import { useStopEstimate } from '$lib/data/app';
  import { EstimateSource, type Route, type Stop } from '$lib/data/types';
  import { themeManager } from '$lib/managers/theme.manager.svelte';
  import { getRouteTint } from '$lib/utils/tints';

  type Props = {
    route: Route;
    stop: Stop;
  };

  let { route, stop }: Props = $props();

  const estimates = $derived(useStopEstimate(() => ({ stop })));
  const isLoading = $derived(estimates.data.source === EstimateSource.LOADING);
</script>

<div
  class="flex flex-wrap items-center gap-1"
  style="--tint: {getRouteTint(route, themeManager.theme)}"
>
  {#if isLoading}
    <Spinner class="size-4 self-center" />
  {/if}

  {#each estimates.data?.estimates ?? [] as estimate, i}
    <TimeBubble {estimate} isNext={i === 0} />
  {/each}
</div>
