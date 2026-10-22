<script lang="ts">
  import Button from '$lib/components/ui/button/button.svelte';
  import { openAppStore } from '$lib/utils/app-version';
  import { CircleArrowUp } from '@lucide/svelte';
</script>

<div
  class="pointer-events-auto fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background p-8 text-center"
>
  <CircleArrowUp class="size-16 text-muted-foreground" />
  <h1 class="text-2xl font-bold">Update Required</h1>
  <p class="text-muted-foreground">
    This version of Maroon Rides is no longer supported. Update the app to keep tracking buses.
  </p>
  <Button class="rounded-full" size="lg" onclick={openAppStore}>Update</Button>
</div>
