<script lang="ts">
  import { X } from 'lucide-svelte';
  import Button from '../button/button.svelte';

  type Props = {
    onclick: () => void;
  };

  let { onclick }: Props = $props();
</script>

<div class="flex items-center gap-2">
  <Button
    variant="outline"
    class="rounded-full border-0 bg-neutral-400 shadow-none"
    aria-label="Close"
    size="icon-xs"
    {onclick}
  >
    <X color="white" />
  </Button>
</div>
