<script lang="ts">
  import { cn } from '$lib/utils.js';
  import { Tabs as TabsPrimitive } from 'bits-ui';
  import { onMount } from 'svelte';

  let { ref = $bindable(null), class: className, ...restProps }: TabsPrimitive.ListProps = $props();

  let indicator: HTMLDivElement;

  function updateIndicator(animated = true) {
    const activeTab = ref?.querySelector<HTMLElement>('[data-state="active"]');
    if (!activeTab?.offsetWidth) return;

    if (!animated) indicator.style.transition = 'none';

    indicator.style.transform = `translateX(${activeTab.offsetLeft}px)`;
    indicator.style.width = `${activeTab.offsetWidth}px`;
    indicator.style.opacity = '1';

    if (!animated) {
      // flush the layout so re-enabling the transition doesn't animate from the old position
      void indicator.offsetWidth;
      indicator.style.transition = '';
    }
  }

  onMount(() => {
    if (!ref) return;

    // geometry changed (rotation, breakpoint, sheet snap) — snap, and place it initially
    const resizeObserver = new ResizeObserver(() => updateIndicator(false));
    resizeObserver.observe(ref);

    // a different tab became active — slide
    const activeObserver = new MutationObserver(() => updateIndicator());
    activeObserver.observe(ref, {
      attributes: true,
      subtree: true,
      attributeFilter: ['data-state'],
    });

    return () => {
      resizeObserver.disconnect();
      activeObserver.disconnect();
    };
  });
</script>

<TabsPrimitive.List
  bind:ref
  data-slot="tabs-list"
  class={cn(
    'relative inline-flex h-9 w-full items-center justify-center rounded-full bg-muted p-0.75 text-muted-foreground',
    className,
  )}
  {...restProps}
>
  <div
    bind:this={indicator}
    class="absolute top-0.75 left-0 h-[calc(100%-6px)] rounded-full border border-transparent bg-background opacity-0 shadow-sm transition-[transform,width] duration-300 ease-[cubic-bezier(0.25,1.25,0.5,1)] dark:border-input dark:bg-input"
  ></div>
  {@render restProps.children?.()}
</TabsPrimitive.List>
