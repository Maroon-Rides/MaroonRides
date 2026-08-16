<script lang="ts">
  import { fly } from 'svelte/transition';
  import * as Card from './ui/card';
  import { onMount, untrack } from 'svelte';
  import * as Empty from './ui/empty';
  import { connectivityManager, ConnectionStatus } from '$lib/managers/connectivity.manager.svelte';
  import { CloudOff } from '@lucide/svelte';
  import { Spinner } from './ui/spinner';

  type Props = {
    animateTime?: number;
    morphTime?: number; // circle <-> text expansion
    holdTime?: number; // beat spent as a circle before the icon and label swap
    initialHideTime?: number; // prevent popup from showing on mount (ex, at homepage startup)
    offset?: string; // gap between the safe area (notch/camera cutout) and the pill
  };

  const {
    animateTime = 500,
    morphTime = 300,
    holdTime = 200,
    initialHideTime = 0,
    offset = '0.75rem',
  }: Props = $props();

  // circle diameter: pl-2 + size-7 icon + matching right gap + the card's 1px borders
  const COLLAPSED_WIDTH = 46;
  const SETTLE_TIME = 50; // lets the measurement catch up to a freshly swapped label

  let mayShow = $state(true);
  let contentWidth = $state(0);

  const status = $derived.by(connectivityManager.getConnectionStatus);
  const isBadStatus = $derived(status !== ConnectionStatus.ONLINE);

  // what the pill is currently displaying, which lags `status` while it collapses to swap
  let shownStatus = $state<ConnectionStatus | undefined>(undefined);
  let expanded = $state(false);

  const Icon = $derived(shownStatus === ConnectionStatus.OFFLINE ? CloudOff : Spinner);
  // 'auto' before the first measurement: it isn't interpolable, so the pill lands at its full
  // size instead of animating open on arrival
  const width = $derived(
    !expanded ? `${COLLAPSED_WIDTH}px` : contentWidth ? `${contentWidth + 2}px` : 'auto',
  );

  onMount(() => {
    if (initialHideTime > 0) {
      mayShow = false;
      setTimeout(() => (mayShow = true), initialHideTime);
    }
  });

  // drop in fully open; on a later change, close to a circle, swap the icon, and open again
  $effect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // rewind once it's off screen so the next appearance starts fresh. waiting out the fly
    // keeps the label and icon from blanking mid-exit
    if (!mayShow || !isBadStatus) {
      timers.push(
        setTimeout(() => {
          shownStatus = undefined;
          expanded = false;
          contentWidth = 0; // re-measure on the way back in, so a new label doesn't animate
        }, animateTime),
      );
      return () => timers.forEach(clearTimeout);
    }

    const target = status;
    if (untrack(() => shownStatus) === target) return;

    if (untrack(() => shownStatus) === undefined) {
      // arrives already open: the circle is only ever a step in swapping the label
      shownStatus = target;
      expanded = true;
    } else {
      expanded = false;
      timers.push(setTimeout(() => (shownStatus = target), morphTime + holdTime));
      timers.push(setTimeout(() => (expanded = true), morphTime + holdTime + SETTLE_TIME));
    }

    return () => timers.forEach(clearTimeout);
  });
</script>

{#if mayShow && isBadStatus && shownStatus !== undefined}
  <div
    class="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center"
    style="
      padding-top: calc(env(safe-area-inset-top, 0px) + {offset});
      padding-left: calc(env(safe-area-inset-left, 0px) + 0.75rem);
      padding-right: calc(env(safe-area-inset-right, 0px) + 0.75rem);
    "
  >
    <div
      in:fly={{ y: -100, duration: animateTime, opacity: 1 }}
      out:fly={{ y: -100, duration: animateTime, opacity: 1 }}
    >
      <Card.Root
        class="flex-row items-center overflow-hidden rounded-full shadow-md transition-[width] ease-out motion-reduce:transition-none"
        style="width: {width}; transition-duration: {morphTime}ms"
      >
        <!-- measured at its natural width so the card can animate toward it; the +2px above
             covers the card's 1px border on each side, which clientWidth leaves out -->
        <div
          bind:clientWidth={contentWidth}
          class="flex w-max shrink-0 flex-row items-center gap-2 py-2 pr-4 pl-2 whitespace-nowrap"
        >
          <Empty.Media variant="icon" class="mb-0 size-7 rounded-full">
            <Icon class="size-4" />
          </Empty.Media>
          <Empty.Title
            class="text-sm font-semibold tracking-wide transition-opacity ease-out {expanded
              ? 'opacity-100'
              : 'opacity-0'}"
            style="transition-duration: {morphTime}ms"
          >
            {ConnectionStatus.asMessage(shownStatus)}
          </Empty.Title>
        </div>
      </Card.Root>
    </div>
  </div>
{/if}
