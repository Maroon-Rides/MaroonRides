<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import * as Accordion from '$lib/components/ui/accordion';
  import * as BottomSheet from '$lib/components/ui/bottom-sheet';
  import { PlanOption } from '$lib/data/types';
  import { mapManager } from '$lib/managers/map.manager.svelte';
  import { planManager } from '$lib/managers/plan.manager.svelte';
  import { describeLeg, formatClock } from '$lib/utils/route-planning';
  import StepRow from './StepRow.svelte';

  $effect(() => {
    if (!planManager.selectedPlan) onClose();
  });

  // Bus routes come back when the page closes.
  let mapRoutes = [...mapManager.drawnRoutes];
  $effect(() => {
    mapManager.setDrawnRoutes([], false);
    planManager.shownInstruction = -1;
  });

  const plan = $derived(planManager.selectedPlan);
  // The arrival closes the timeline as its own step, after every leg.
  const steps = $derived(
    plan
      ? [
          ...(plan.legs ?? []).map((leg) => ({
            icon: PlanOption.fromLegType(leg.type),
            time: formatClock(leg.startAt),
            content: describeLeg(leg),
            instructions: leg.walk?.steps ?? [],
          })),
          {
            icon: PlanOption.END,
            time: formatClock(plan.arriveAt),
            content: `Arrive at ${plan.legs?.at(-1)?.to.name ?? ''}`,
            instructions: [],
          },
        ]
      : [],
  );

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
      <BottomSheet.Header
        title="Trip Plan"
        subtitle={plan ? `Arrive at ${formatClock(plan.arriveAt)}` : ''}
      >
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
        {#each steps as step, i}
          <StepRow
            value={String(i)}
            icon={step.icon}
            time={step.time}
            content={step.content}
            instructions={step.instructions}
            isLast={i === steps.length - 1}
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
