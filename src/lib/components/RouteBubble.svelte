<script lang="ts">
  import type { Route } from '$lib/data/types';
  import { themeManager } from '$lib/managers/theme.manager.svelte';
  import { getRouteTint } from '$lib/utils/tints';
  import { fit, parent_style } from '@leveluptuts/svelte-fit';
  import { tv, type VariantProps } from 'tailwind-variants';

  type Props = {
    route: Route;
    type?: VariantProps<typeof style>['type'];
  };

  let { route, type }: Props = $props();

  let tintColor = $derived(getRouteTint(route, themeManager.theme));

  const style = tv({
    base: 'flex items-center justify-center rounded-md',
    defaultVariants: {
      type: 'rowIcon',
    },
    variants: {
      type: {
        rowIcon: 'h-10 w-12 p-1.25',
        calloutIcon: 'h-6 min-w-8 p-1 px-2',
      },
    },
  });
</script>

<div class={style({ type })} style="background-color: {tintColor};">
  <div style="{parent_style} display: flex; align-items: center; justify-content: center;">
    <p class="text-sm font-bold text-white" use:fit={{ max_size: 22, min_size: 1 }}>
      {route.routeCode}
    </p>
  </div>
</div>
