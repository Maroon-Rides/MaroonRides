<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog';
  import { cn } from '$lib/utils.js';
  import { OctagonPauseIcon } from '@lucide/svelte';

  let { class: className }: { class?: string } = $props();
</script>

<Dialog.Root>
  <Dialog.Trigger class={cn('text-muted-foreground', className)} aria-label="What is a time point?">
    <OctagonPauseIcon class="size-6" />
  </Dialog.Trigger>

  <Dialog.Content>
    <Dialog.Title>Time Point</Dialog.Title>
    <Dialog.Description>
      Buses will always stop at this location and wait until the scheduled departure time if they
      are running early.
    </Dialog.Description>
  </Dialog.Content>
</Dialog.Root>
