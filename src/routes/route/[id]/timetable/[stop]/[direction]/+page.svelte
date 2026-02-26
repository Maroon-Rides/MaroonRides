<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import RouteRow from '$lib/components/RouteRow.svelte';
  import Timetable from '$lib/components/Timetable.svelte';
  import * as BottomSheet from '$lib/components/ui/bottom-sheet';
  import DateStepper from '$lib/components/ui/date-stepper/date-stepper.svelte';
  import Spinner from '$lib/components/ui/spinner/spinner.svelte';
  import { useRoutes, useStopSchedule } from '$lib/data/app';
  import moment from 'moment';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const snapPoints = [
    { height: 50, id: 'm' },
    { height: 80, id: 'l' },
  ];

  let date = $state(moment());

  const routes = useRoutes();

  const route = $derived(routes.data?.find((r) => r.id === data.routeId) ?? null);
  const direction = $derived(route?.directions.find((d) => d.id === data.directionId) ?? null);
  const stop = $derived(direction?.stops.find((s) => s.id === data.stopId) ?? null);

  const timetable = useStopSchedule(() => ({ stop, date }));

  function onClose() {
    goto(`/route/${route?.id}`);
  }
</script>

{#key page.url.pathname}
  <BottomSheet.Root initialSnapIndex={0} {snapPoints}>
    {#snippet header()}
      <BottomSheet.Header title={stop?.name ?? 'Schedule'}>
        {#snippet actions()}
          <BottomSheet.CloseButton onclick={onClose} />
        {/snippet}
      </BottomSheet.Header>
    {/snippet}

    <div class="flex flex-col gap-4 px-4 py-2 pb-6">
      <DateStepper bind:selectedDate={date} minDate={moment()} class="self-center" />

      {#if timetable.isLoading}
        <Spinner class="size-6 self-center" />
      {:else if routes.isError}
        <p>Error loading routes: {routes.error.message}</p>
      {:else if timetable.data?.length === 0}
        <p class="text-center text-sm text-muted-foreground">
          No scheduled arrivals for this stop on this day.
        </p>
      {/if}

      {#each timetable.data as table}
        {#if table.route.id == route?.id && table.direction.id == direction?.id}
          <div class="mb-2 flex flex-col gap-3">
            <RouteRow
              route={table.route}
              subtitle={direction.name.trim()}
              onclick={() => goto(`/route/${table.route.id}`)}
            />
            {#if table.timetable.length === 0}
              <p class="text-center text-sm text-muted-foreground">No timetable for selected day</p>
            {:else}
              <Timetable schedule={table} {date} />
            {/if}
          </div>
        {/if}
      {/each}
    </div>
  </BottomSheet.Root>
{/key}
