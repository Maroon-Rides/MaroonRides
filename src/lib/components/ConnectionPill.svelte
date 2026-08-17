<script lang="ts">
  import { fly } from 'svelte/transition';
  import * as Card from './ui/card';
  import { onMount } from 'svelte';
  import * as Empty from './ui/empty';
  import { connectivityManager } from '$lib/managers/connectivity.manager.svelte';
  import { CloudOff } from '@lucide/svelte';
  import { Spinner } from './ui/spinner';
  import { ConnectionStatus } from '$lib/data/types';

  type Props = {
    animateTime?: number;
    initialHideTime?: number; // prevent popup from showing on mount (ex, at homepage startup)
    offset?: string; // gap between the safe area (notch/camera cutout) and the pill
  };

  const { animateTime = 500, initialHideTime = 0, offset = '0.75rem' }: Props = $props();

  let mayShow = $state(false);
  let contentWidth = $state(0);

  const status = $derived.by(connectivityManager.getConnectionStatus);
  const isBadStatus = $derived(status !== ConnectionStatus.ONLINE);

  onMount(() => {
    if (initialHideTime > 0) {
      mayShow = false;
      setTimeout(() => (mayShow = true), initialHideTime);
    }
  });
</script>

{#if mayShow && isBadStatus}
  {@const Icon = status === ConnectionStatus.OFFLINE ? CloudOff : Spinner}
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
        class="flex-row items-center overflow-hidden rounded-full shadow-md transition-[width] duration-300 ease-out motion-reduce:transition-none"
        style="width: {contentWidth ? `${contentWidth + 2}px` : 'auto'}"
      >
        <div
          bind:clientWidth={contentWidth}
          class="flex w-max shrink-0 flex-row items-center gap-2 py-2 pr-4 pl-2 whitespace-nowrap"
        >
          <Empty.Media variant="icon" class="mb-0 size-7 rounded-full">
            <Icon class="size-4" />
          </Empty.Media>
          <Empty.Title class="text-sm font-semibold tracking-wide">
            {ConnectionStatus.asMessage(status)}
          </Empty.Title>
        </div>
      </Card.Root>
    </div>
  </div>
{/if}
