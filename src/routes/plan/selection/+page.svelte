<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import * as Accordion from '$lib/components/ui/accordion';
  import * as BottomSheet from '$lib/components/ui/bottom-sheet';
  import { PlanOption } from '$lib/data/types';
  import { mapManager } from '$lib/managers/map.manager.svelte';
  import { planManager } from '$lib/managers/plan.manager.svelte';
  import StepRow from './StepRow.svelte';

  //if somehow not loaded
  $effect(() => {
    if (!planManager.selectedPlan) onClose();
  });

  // clear bus routes first
  let mapRoutes = [...mapManager.drawnRoutes];
  $effect(() => {
    mapManager.setDrawnRoutes([], false);
    planManager.shownInstruction = -1;
  });

  // strips the inline html the API returns, so the markup below is the only thing @html renders
  const domParser = new DOMParser();
  const format = (s: string) =>
    (domParser.parseFromString(s, 'text/html').body.textContent ?? '')
      .replaceAll(/(\d\))([a-zA-Z])/g, '$1<br>$2') //insert line break (not always present)
      .replaceAll(/((?:[A-Z][\w.'-]*)(?: [A-Z][\w.'-]*)*)\s*\(ID:\s*\d+\)/g, '<b>$1</b>'); //bold the stop name, drop its id

  const plan = $derived(planManager.selectedPlan);
  const instructions = $derived(plan?.instructions ?? []);
  const formattedContent = $derived(instructions.map((instr) => format(instr.instruction)));

  //restore routes
  function onClose() {
    mapManager.setDrawnRoutes(mapRoutes);
    goto('/plan');
  }
</script>

{#key page.url.pathname}
  <BottomSheet.Root
    initialSnapIndex={0}
    snapPoints={[
      { height: 40, id: 'm' },
      { height: 80, id: 'l' },
    ]}
  >
    {#snippet header()}
      <BottomSheet.Header title="Trip Plan" subtitle={`Arrive at ${plan?.endTimeText ?? ''}`}>
        {#snippet actions()}
          <BottomSheet.CloseButton onclick={onClose} />
        {/snippet}
      </BottomSheet.Header>
    {/snippet}

    {#snippet children()}
      <Accordion.Root
        type="single"
        bind:value={
          () => (planManager.shownInstruction === -1 ? '' : String(planManager.shownInstruction)),
          (value) => (planManager.shownInstruction = value === '' ? -1 : Number(value))
        }
        class="px-4 pt-3"
      >
        {#each instructions as step, i}
          <StepRow
            value={String(i)}
            icon={PlanOption.fromMovementType(step.movementType)}
            time={step.time}
            content={formattedContent[i]}
            instructions={step.detailedWalkingInstructions}
            isLast={i === instructions.length - 1}
            isFirst={i === 0}
          />
        {/each}
      </Accordion.Root>
      <p class="mt-2 pb-2 text-center text-xs text-muted-foreground">
        Route Directions provided by Google
      </p>
    {/snippet}
  </BottomSheet.Root>
{/key}
