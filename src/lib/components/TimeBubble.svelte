<script lang="ts">
  import type { TimeEstimate } from '$lib/data/types';
  import { cn } from '$lib/utils';
  import { Rss } from 'lucide-svelte';
  import moment from 'moment';
  import { tv } from 'tailwind-variants';

  type Props = {
    estimate: TimeEstimate;
    isNext: boolean;
    class?: string;
  };

  let { estimate, isNext, class: className }: Props = $props();

  const date = $derived(estimate.estimatedTime ?? estimate.scheduledTime);
  const relative = $derived(date.diff(moment(), 'minutes'));

  const styles = tv({
    base: 'flex flex-col items-center rounded-md px-2 py-0.5 dark:text-white',
    variants: {
      isNext: {
        true: 'bg-[var(--tint)]/30 font-bold text-[var(--tint)]',
        false: 'bg-muted-foreground/30',
      },
    },
  });
</script>

<div class={cn(styles({ isNext }), className)}>
  <span class="flex items-center text-sm font-bold">
    {relative <= 0 ? 'Now' : `${relative} min`}
    {#if estimate.isRealTime}
      <Rss class="mt-1 ml-0.5 size-2 self-start stroke-4" />
    {/if}
  </span>
</div>
