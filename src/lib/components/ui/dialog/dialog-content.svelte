<script lang="ts">
  import { cn, type WithoutChildrenOrChild } from '$lib/utils.js';
  import { XIcon } from '@lucide/svelte';
  import { Dialog as DialogPrimitive } from 'bits-ui';
  import type { Snippet } from 'svelte';
  import DialogOverlay from './dialog-overlay.svelte';

  let {
    ref = $bindable(null),
    class: className,
    children,
    showCloseButton = true,
    ...restProps
  }: WithoutChildrenOrChild<DialogPrimitive.ContentProps> & {
    children?: Snippet;
    showCloseButton?: boolean;
  } = $props();
</script>

<DialogPrimitive.Portal>
  <DialogOverlay />
  <DialogPrimitive.Content
    bind:ref
    data-slot="dialog-content"
    class={cn(
      'fixed top-1/2 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 flex-col gap-2 rounded-xl border bg-popover p-5 text-popover-foreground shadow-lg data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
      className,
    )}
    {...restProps}
  >
    {@render children?.()}

    {#if showCloseButton}
      <DialogPrimitive.Close
        class="absolute end-3 top-3 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <XIcon class="size-4" />
        <span class="sr-only">Close</span>
      </DialogPrimitive.Close>
    {/if}
  </DialogPrimitive.Content>
</DialogPrimitive.Portal>
