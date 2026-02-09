<script lang="ts">
  import type { WithElementRef } from '$lib/utils';
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  type Props = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
    title: string;
    subtitle?: string;
    actions?: Snippet;
    leading?: Snippet;
  };

  let {
    ref = $bindable(null),
    title,
    subtitle,
    children,
    actions,
    leading,
    ...restProps
  }: Props = $props();
</script>

<div class="flex flex-col gap-1 px-4" {...restProps}>
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-2">
      {@render leading?.()}
      <h2 class="text-[1.75rem] font-semibold">{title}</h2>
    </div>
    {@render actions?.()}
  </div>
  {#if subtitle}
    <p class="text-sm text-muted-foreground">{subtitle}</p>
  {/if}

  {@render children?.()}
</div>

<div class="mt-2 mb-0 h-px w-full bg-border"></div>
