<script lang="ts">
  import type { Route } from '$lib/data/types';
  import { MoveHorizontal } from 'lucide-svelte';
  import RouteBubble from './RouteBubble.svelte';

  interface Props {
    route: Route;
    onclick?: () => void;
  }

  let { route, onclick }: Props = $props();
</script>

<button class="flex flex-row items-center gap-3 hover:cursor-pointer" {onclick}>
  <RouteBubble {route} />

  <div>
    <p class="text-justify text-lg leading-tight font-bold">{route.name}</p>
    <div class="text-sm">
      {#if route.directions.length === 0}
        <span>Campus Circulator</span>
      {/if}
      <div class="flex flex-row items-center gap-1">
        {#each route.directions as endpoint, index}
          <p class="text-sm">{endpoint.name}</p>
          {#if index < route.directions.length - 1}
            <MoveHorizontal size={12} />
          {/if}
        {/each}
      </div>
    </div>
  </div>
</button>
