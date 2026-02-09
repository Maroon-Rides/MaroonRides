<script lang="ts">
  import { goto } from '$app/navigation';
  import type { Direction } from '$lib/data/types';
  import { fit, parent_style } from '@leveluptuts/svelte-fit';
  import { MoveHorizontal } from 'lucide-svelte';

  interface Props {
    id: string;
    busNumber: string;
    routeColor: string;
    title: string;
    endpoints: Direction[];
  }

  let { id, busNumber, routeColor, title, endpoints }: Props = $props();

  function onclick() {
    goto(`/route/${id}`);
  }
</script>

<button class="flex flex-row items-center gap-3 hover:cursor-pointer" {onclick}>
  <div
    class="flex h-10 w-12 items-center justify-center rounded-md p-1"
    style="background-color: {routeColor};"
  >
    <div style="{parent_style} display: flex; align-items: center; justify-content: center;">
      <p class="text-sm font-bold text-white" use:fit={{ max_size: 22 }}>{busNumber}</p>
    </div>
  </div>

  <div>
    <p class="text-justify text-lg leading-tight font-bold">{title}</p>
    <div class="text-sm">
      {#if endpoints.length === 0}
        <span>Campus Circulator</span>
      {/if}
      <div class="flex flex-row items-center gap-1">
        {#each endpoints as endpoint, index}
          <p class="text-sm">{endpoint.name}</p>
          {#if index < endpoints.length - 1}
            <MoveHorizontal size={12} />
          {/if}
        {/each}
      </div>
    </div>
  </div>
</button>
