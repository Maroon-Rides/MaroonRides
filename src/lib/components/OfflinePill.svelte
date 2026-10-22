<script lang="ts">
  import { liveDataManager } from '$lib/managers/live-data.manager.svelte';
  import { cn } from '$lib/utils';
  import { CloudOff } from '@lucide/svelte';
</script>

<div
  class={cn(
    'pointer-events-none fixed inset-x-0 top-0 z-20 flex justify-center pt-[env(safe-area-inset-top)] transition-[translate,opacity] duration-300 ease-out',
    !liveDataManager.isOffline && '-translate-y-full opacity-0',
  )}
  aria-hidden={!liveDataManager.isOffline}
>
  <div
    class="mt-2 flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm font-medium shadow-lg dark:border-input dark:bg-card"
  >
    <CloudOff class="size-4" />
    Offline
  </div>
</div>
