<script lang="ts">
  import type { TripWalkStep } from '$lib/api/client';

  type Props = {
    instructions: TripWalkStep[];
  };

  let { instructions }: Props = $props();
</script>

<ul class="flex flex-col rounded-lg bg-muted p-3">
  {#each instructions as step, i}
    <li class="text-left text-xs">{i + 1}. {step.instruction}</li>
  {/each}
</ul>
