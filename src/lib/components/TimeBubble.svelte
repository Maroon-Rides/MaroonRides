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
    base: 'flex flex-col items-center rounded-md px-2 py-0.5',
    variants: {
      isNext: {
        true: 'bg-[var(--tint)]/35 font-bold text-white',
        false: 'bg-muted text-muted-foreground',
      },
    },
  });
</script>

<div class={cn(styles({ isNext }), className)}>
  <span class="flex items-center text-sm font-bold">
    {relative <= 0 ? 'Now' : `${relative} min`}
    {#if estimate.isRealTime}
      <Rss class="mt-1 ml-1 size-2 self-start stroke-4" />
    {/if}
  </span>
</div>
