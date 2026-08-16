<script lang="ts">
  import { fly } from 'svelte/transition';
  import * as Card from './ui/card';
  import { onMount } from 'svelte';
  import * as Empty from './ui/empty';
  import { connectivityManager, ConnectionStatus } from '$lib/managers/connectivity.manager.svelte';
  import { CloudOff } from '@lucide/svelte';
  import { Spinner } from './ui/spinner';

  type Props = {
    animateTime?: number;
    initialHideTime?: number; // prevent popup from showing on mount (ex, at homepage startup)
  };

  const { animateTime = 500, initialHideTime = 0 }: Props = $props();

  let mayShow = $state(true);

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
    in:fly={{ y: -100, duration: animateTime, opacity: 1 }}
    out:fly={{ y: -100, duration: animateTime, opacity: 1 }}
  >
    <Card.Root class="gap-1 rounded-t-none">
      <div class="mt-2 flex flex-1 items-center justify-center gap-2">
        <Empty.Media variant="icon">
          <Icon class="size-4" />
        </Empty.Media>
        <Empty.Title class="-mt-1.5 text-lg font-bold tracking-wide">
          {ConnectionStatus.asMessage(status)}
        </Empty.Title>
      </div>
    </Card.Root>
  </div>
{/if}
