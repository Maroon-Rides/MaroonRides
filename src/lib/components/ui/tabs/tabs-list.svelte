<script lang="ts">
  import { cn } from '$lib/utils.js';
  import { Tabs as TabsPrimitive } from 'bits-ui';
  import { onMount, tick } from 'svelte';

  let { ref = $bindable(null), class: className, ...restProps }: TabsPrimitive.ListProps = $props();

  let indicatorStyle = $state('opacity: 0;');

  function updateIndicator(animated = true) {
    if (!ref) return;
    const activeTab = ref.querySelector('[data-state="active"]') as HTMLElement;
    if (activeTab) {
      const { offsetLeft, offsetWidth } = activeTab;
      indicatorStyle = `transform: translateX(${offsetLeft}px); width: ${offsetWidth}px; opacity: 1; ${animated ? 'transition: all 0.3s cubic-bezier(0.25, 1.25, 0.5, 1);' : ''}`;
    }
  }

  onMount(() => {
    window.addEventListener('resize', () => updateIndicator(false));

    tick().then(() => updateIndicator());
    const observer = new MutationObserver(() => updateIndicator());
    if (ref) {
      observer.observe(ref, {
        attributes: true,
        subtree: true,
        attributeFilter: ['data-state'],
      });
    }
    return () => observer.disconnect();
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
    class="absolute top-0.75 left-0 h-[calc(100%-6px)] rounded-full border border-transparent bg-background shadow-sm dark:border-input dark:bg-input/30"
    style={indicatorStyle}
  ></div>
  {@render restProps.children?.()}
</TabsPrimitive.List>
