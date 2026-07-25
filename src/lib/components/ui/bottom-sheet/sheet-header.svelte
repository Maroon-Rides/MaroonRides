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
  <div class="flex items-center justify-between gap-3">
    <div class="flex min-w-0 flex-1 items-center gap-3">
      {@render leading?.()}
      <h2 class="text-[1.75rem] leading-tight font-semibold wrap-break-word">{title}</h2>
    </div>
    <div class="shrink-0">
      {@render actions?.()}
    </div>
  </div>
  {#if subtitle}
    <p class="text-md -mt-2 mb-1 text-muted-foreground">{subtitle}</p>
  {/if}

  {@render children?.()}
</div>

<hr class="mt-2 mb-0" />
