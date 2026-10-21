<script lang="ts">
  import TimeBubble from '$lib/components/TimeBubble.svelte';
  import Spinner from '$lib/components/ui/spinner/spinner.svelte';
  import { EstimateSource, type Route, type StopEstimates } from '$lib/data/types';
  import { themeManager } from '$lib/managers/theme.manager.svelte';
  import { getRouteTint } from '$lib/utils/tints';

  type Props = {
    route: Route;
    estimates: StopEstimates;
  };

  let { route, estimates }: Props = $props();
</script>

<div
  class="flex flex-wrap items-center gap-1"
  style="--tint: {getRouteTint(route, themeManager.theme)}"
>
  {#if estimates.source === EstimateSource.LOADING}
    <Spinner class="size-4 self-center" />
  {/if}

  {#each estimates.estimates as estimate, i}
    <TimeBubble {estimate} isNext={i === 0} />
  {/each}
</div>
