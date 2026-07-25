<script lang="ts">
  import MarkerContent from '$lib/components/ui/map/MarkerContent.svelte';
  import type { Route, Stop } from '$lib/data/types';
  import { themeManager } from '$lib/managers/theme.manager.svelte';
  import { getRouteTint } from '$lib/utils/tints';
  import { getLighterColor } from '$lib/utils/utils';

  type Props = {
    route: Route;
    stop: Stop;
    isSelected?: boolean;
  };

  let { stop, route, isSelected }: Props = $props();

  const tint = $derived(getRouteTint(route, themeManager.theme));
  const borderTint = $derived(getLighterColor(tint));
</script>

<MarkerContent>
  <!-- padding to increase touch target size -->
  <div class="p-3">
    <div
      class="z-18 size-4 rounded-full border-2 shadow-lg"
      style="border-color: {borderTint}; background-color: {tint}; opacity: {isSelected ? 1 : 0.5}"
    ></div>
  </div>
</MarkerContent>
