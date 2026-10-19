<script lang="ts">
  import { liveDataManager } from '$lib/managers/live-data.manager.svelte';
  import { CloudOff } from '@lucide/svelte';
  import { cubicOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';

  const SLIDE_FROM = '-100%';
  const SLIDE_DURATION_MS = 300;
</script>

{#if liveDataManager.isOffline}
  <div
    class="pointer-events-none fixed inset-x-0 top-0 z-20 flex justify-center pt-[env(safe-area-inset-top)]"
    transition:fly={{ y: SLIDE_FROM, duration: SLIDE_DURATION_MS, easing: cubicOut }}
  >
    <div
      class="mt-2 flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm font-medium shadow-lg dark:border-input dark:bg-card"
    >
      <CloudOff class="size-4" />
      Offline
    </div>
  </div>
{/if}
