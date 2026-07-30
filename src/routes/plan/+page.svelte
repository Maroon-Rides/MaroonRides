<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import TimeInput from '$lib/components/TimeInput.svelte';
  import * as BottomSheet from '$lib/components/ui/bottom-sheet';
  import Button from '$lib/components/ui/button/button.svelte';
  import * as Empty from '$lib/components/ui/empty';
  import * as Item from '$lib/components/ui/item';
  import { Spinner } from '$lib/components/ui/spinner';
  import * as Tabs from '$lib/components/ui/tabs';
  import { MyLocation, PlanOption } from '$lib/data/types';
  import { planManager, usePlanState } from '$lib/managers/plan.manager.svelte';
  import { ArrowUpDown, Circle, CircleAlert, MapPin } from '@lucide/svelte';
  import { Duration } from 'luxon';
  import LocationInput from './LocationInput.svelte';
  import SelectionRow from './SelectionRow.svelte';

  usePlanState();

  //to not bleed state outside of /plan
  async function onClose() {
    await goto('/');
    planManager.reset();
  }

  function onSwap() {
    planManager.swapLocations();
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  }

  function relTime(seconds: number): string {
    const { hours, minutes } = Duration.fromMillis(seconds * 1e3)
      .shiftTo('hours', 'minutes')
      .toObject();
    return Duration.fromObject({
      minutes: Math.floor(minutes ?? 0),
      ...(hours && { hours }),
    }).toHuman();
  }
</script>

{#key page.url.pathname}
  <BottomSheet.Root
    initialSnapIndex={1}
    snapPoints={[
      { height: 40, id: 'm' },
      { height: 80, id: 'l' },
    ]}
  >
    {#snippet header()}
      <BottomSheet.Header title="Plan a Route">
        {#snippet actions()}
          <BottomSheet.CloseButton onclick={onClose} />
        {/snippet}
        <div class="flex pt-1 pb-2">
          <div class="flex flex-1 flex-col gap-1">
            <!-- origin -->
            <LocationInput
              bind:value={planManager.start.searchTerm}
              location={planManager.start.location?.type}
              component={Circle}
              oninput={() => (planManager.start.location = null)}
              onfocus={() => planManager.focus('start')}
            />
            <!-- dots -->
            <ul class="pointer-events-none ml-[0.925rem] flex flex-col gap-[0.15rem]">
              {#each [0, 1, 2] as _}
                <li class="size-[0.15rem] rounded-full bg-muted-foreground"></li>
              {/each}
            </ul>
            <!-- destination -->
            <LocationInput
              bind:value={planManager.end.searchTerm}
              location={planManager.end.location?.type}
              component={MapPin}
              oninput={() => (planManager.end.location = null)}
              onfocus={() => planManager.focus('end')}
            />
          </div>
          <!-- swapper -->
          <Button variant="ghost" size="icon" class="-mr-1.5 ml-1.5 self-center" onclick={onSwap}>
            <ArrowUpDown class="size-5 text-muted-foreground" />
          </Button>
        </div>

        <!-- leave/arrive -->
        <div class="flex items-center gap-2 pb-1">
          <Tabs.Root class="flex-1" bind:value={planManager.deadline}>
            <Tabs.List>
              <Tabs.Trigger value="leave">Leave by</Tabs.Trigger>
              <Tabs.Trigger value="arrive">Arrive by</Tabs.Trigger>
            </Tabs.List>
          </Tabs.Root>
          <TimeInput value={planManager.planTime} onchange={(dt) => (planManager.planTime = dt)} />
        </div>
      </BottomSheet.Header>
    {/snippet}

    {#snippet children()}
      {#if planManager.error}
        <Empty.Root>
          <Empty.Header>
            <Empty.Media variant="icon">
              <CircleAlert />
            </Empty.Media>
            <Empty.Title class="-mt-2 text-muted-foreground">{planManager.error}</Empty.Title>
          </Empty.Header>
        </Empty.Root>
      {:else if planManager.loading}
        <Empty.Root>
          <Empty.Media>
            <Spinner class="size-6" />
          </Empty.Media>
        </Empty.Root>
      {:else}
        <Item.Group class="gap-0">
          {#if planManager.activeInput}
            <!-- show suggestions -->
            {#if planManager.showMyLocation}
              <SelectionRow
                icon={PlanOption.MY_LOCATION}
                title="My Location"
                onclick={() => planManager.selectSuggestion({ ...MyLocation })}
              />
            {:else if planManager.suggestions.length}
              {#each planManager.suggestions as suggestion, i}
                {#if i > 0}
                  <Item.Separator class="my-0" />
                {/if}
                <SelectionRow
                  icon={PlanOption.BUS}
                  title={suggestion.name}
                  subtitle={`ID: ${suggestion.id}`}
                  sideArrow={false}
                  onclick={() => planManager.selectSuggestion(suggestion)}
                />
              {/each}
            {/if}
          {:else}
            <!-- show plans -->
            {#each planManager.plans as plan, i}
              {#if i > 0}
                <Item.Separator class="my-0" />
              {/if}
              <SelectionRow
                icon={planManager.hasBus(plan) ? PlanOption.BUS : PlanOption.WALKING}
                title={relTime(plan.endTime - plan.startTime)}
                subtitle={`Arrive at ${plan.endTimeText}`}
                sideArrow={true}
                onclick={() => {
                  planManager.selectedPlan = plan;
                  goto('/plan/selection');
                }}
              />
            {/each}
          {/if}
        </Item.Group>
      {/if}
    {/snippet}
  </BottomSheet.Root>
{/key}
