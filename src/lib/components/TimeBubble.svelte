<script lang="ts">
  import type { TimeEstimate } from '$lib/data/types';
  import { cn } from '$lib/utils';
  import { Rss } from '@lucide/svelte';
  import moment from 'moment';
  import { tv } from 'tailwind-variants';

  type Props = {
    estimate: TimeEstimate;
    isNext: boolean;
    class?: string;
    type?: 'default' | 'callout';
  };

  let { estimate, isNext, class: className, type = 'default' }: Props = $props();

  const date = $derived(estimate.estimatedTime ?? estimate.scheduledTime);
  const relative = $derived(date.diff(moment(), 'minutes'));

  const styles = tv({
    base: 'flex flex-col items-center px-2 py-0.5 dark:text-white',
    variants: {
      isNext: {
        true: 'bg-[var(--tint)]/30 font-bold text-[var(--tint)]',
        false: 'bg-muted-foreground/30',
      },
      type: {
        callout: 'rounded-sm text-xs',
        default: 'rounded-md text-sm',
      },
    },
  });
</script>

<div class={cn(styles({ isNext, type }), className)}>
  <span class="flex items-center font-bold">
    {relative <= 0 ? 'Now' : `${relative} min`}
    {#if estimate.isRealTime}
      <Rss class="mt-1 ml-0.5 size-2 self-start stroke-4" />
    {/if}
  </span>
</div>
