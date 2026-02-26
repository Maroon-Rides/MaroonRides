<script lang="ts">
  import type { Route } from '$lib/data/types';
  import { MoveHorizontal } from 'lucide-svelte';
  import RouteBubble from './RouteBubble.svelte';

  interface Props {
    route: Route;
    subtitle?: string;
    onclick?: () => void;
  }

  let { route, onclick, subtitle }: Props = $props();
</script>

<button class="flex flex-row items-center gap-3 hover:cursor-pointer" {onclick}>
  <RouteBubble {route} />

  <div>
    <p class="text-justify text-lg leading-tight font-bold">{route.name}</p>
    <div class="text-left text-sm text-muted-foreground">
      {#if route.directions.length === 0}
        <span>Campus Circulator</span>
      {:else if subtitle}
        <span>{subtitle}</span>
      {:else}
        <div class="flex flex-row items-center gap-1">
          {#each route.directions as endpoint, index}
            <p class="text-sm">{endpoint.name}</p>
            {#if index < route.directions.length - 1}
              <MoveHorizontal size={12} />
            {/if}
          {/each}
        </div>
      {/if}
    </div>
  </div>
</button>
