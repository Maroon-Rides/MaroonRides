<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import RouteRow from '$lib/components/RouteRow.svelte';
  import Timetable from '$lib/components/Timetable.svelte';
  import * as BottomSheet from '$lib/components/ui/bottom-sheet';
  import DateStepper from '$lib/components/ui/date-stepper/date-stepper.svelte';
  import Spinner from '$lib/components/ui/spinner/spinner.svelte';
  import { useRoute, useTimetable } from '$lib/data/app';
  import moment from 'moment';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const snapPoints = [
    { height: 50, id: 'm' },
    { height: 80, id: 'l' },
  ];

  let date = $state(moment());

  const routeQuery = useRoute(() => ({ routeId: data.routeId }));

  const route = $derived(routeQuery.data ?? null);
  const direction = $derived(route?.directions.find((d) => d.id === data.directionId) ?? null);
  const stop = $derived(direction?.stops.find((s) => s.id === data.stopId) ?? null);

  const timetable = useTimetable(() => ({ stop, date }));

  function onClose() {
    goto(`/route/${data.routeId}`);
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

      {#if timetable.isLoading || routeQuery.isLoading}
        <Spinner class="size-6 self-center" />
      {:else if routeQuery.isError}
        <p>Error loading route: {routeQuery.error.message}</p>
      {:else if route && direction}
        <div class="mb-2 flex flex-col gap-3">
          <RouteRow
            {route}
            subtitle={direction.name.trim()}
            onclick={() => goto(`/route/${route.id}`)}
          />
          {#if (timetable.data?.length ?? 0) === 0}
            <p class="text-center text-sm text-muted-foreground">
              No scheduled arrivals for this stop on this day.
            </p>
          {:else}
            <Timetable {route} departures={timetable.data ?? []} />
          {/if}
        </div>
      {/if}
    </div>
  </BottomSheet.Root>
{/key}
