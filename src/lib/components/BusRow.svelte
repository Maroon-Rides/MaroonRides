<script lang="ts">
  import { goto } from '$app/navigation';
  import { MoveHorizontal } from 'lucide-svelte';

  interface Props {
    id: string;
    busNumber: string;
    routeColor: string;
    title: string;
    endpoints: string[];
  }

  let { id, busNumber, routeColor, title, endpoints }: Props = $props();

  function onclick() {
    goto(`/route/${id}`);
  }
</script>

<button class="flex flex-row items-center gap-3 hover:cursor-pointer" {onclick}>
  <div
    class="flex h-10 w-12 flex-col items-center justify-center rounded-md text-sm font-medium"
    style="background-color: {routeColor};"
  >
    <p class="text-lg font-semibold text-white">{busNumber}</p>
  </div>

  <div>
    <p class="text-justify text-lg leading-tight font-bold">{title}</p>
    <div class="text-sm">
      {#if endpoints.length === 0}
        <span>Campus Circulator</span>
      {/if}
      <div class="flex flex-row items-center gap-1">
        {#each endpoints as endpoint, index}
          <p class="text-sm">{endpoint}</p>
          {#if index < endpoints.length - 1}
            <MoveHorizontal size={12} />
          {/if}
        {/each}
      </div>
    </div>
  </div>
</button>
