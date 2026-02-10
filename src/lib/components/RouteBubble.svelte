<script lang="ts">
  import type { Route } from '$lib/data/types';
  import { themeManager } from '$lib/managers/theme.manager.svelte';
  import { getRouteTint } from '$lib/utils/tints';
  import { fit, parent_style } from '@leveluptuts/svelte-fit';

  type Props = {
    route: Route;
  };

  let { route }: Props = $props();

  let tintColor = $derived(getRouteTint(route, themeManager.theme));
</script>

<div
  class="flex h-10 w-12 items-center justify-center rounded-md p-1"
  style="background-color: {tintColor};"
>
  <div style="{parent_style} display: flex; align-items: center; justify-content: center;">
    <p class="text-sm font-bold text-white" use:fit={{ max_size: 22 }}>{route.routeCode}</p>
  </div>
</div>
