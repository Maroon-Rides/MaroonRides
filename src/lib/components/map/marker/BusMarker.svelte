<script lang="ts">
  import MarkerContent from '$lib/components/ui/map/MarkerContent.svelte';
  import type { Bus } from '$lib/data/types';
  import { themeManager } from '$lib/managers/theme.manager.svelte';
  import { getRouteTint } from '$lib/utils/tints';
  import { getLighterColor } from '$lib/utils/utils';
  import { BusFrontIcon } from '@lucide/svelte';

  type Props = {
    bus: Bus;
    isSelected: boolean;
  };

  let { bus, isSelected }: Props = $props();

  const tint = $derived(getRouteTint(bus.route, themeManager.theme));
  const borderTint = $derived(getLighterColor(tint));
</script>

<MarkerContent>
  <div
    class="z-20 flex size-8 items-center justify-center rounded-l-full rounded-tr-full border-2 shadow-lg"
    style="border-color: {isSelected
      ? borderTint
      : 'transparent'}; background-color: {tint}; rotate: {bus.heading -
      135}deg; opacity: {isSelected ? 1 : 0.7}"
  >
    <BusFrontIcon class="size-5 stroke-2 text-white" style="rotate: {-bus.heading - 225}deg" />
  </div>
</MarkerContent>
