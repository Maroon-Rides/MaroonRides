<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import * as BottomSheet from '$lib/components/ui/bottom-sheet';
  import { useRoutes, useStopSchedule } from '$lib/data/app';
  import moment from 'moment';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  console.log('Page URL:', page.url);

  console.log('Stop ID:', data.stopId);
  console.log('Direction ID:', data.directionId);

  const routes = useRoutes();
  const route = $derived(routes.data?.find((r) => r.id === data.routeId) ?? null);
  const stop = $derived(
    route?.directions
      .flatMap((d) => d.stops.map((s) => ({ ...s, directionId: d.id })))
      .find((s) => s.id === data.stopId && s.directionId === data.directionId) ?? null,
  );

  const timetable = $derived(useStopSchedule(stop, moment()));

  function onClose() {
    goto(`/route/${route?.id}`);
  }
</script>

{#key page.url.pathname}
  <BottomSheet.Root initialSnapIndex={1}>
    {#snippet header()}
      <BottomSheet.Header title="Timetable" subtitle={`${route?.name} - ${stop?.name}`}>
        {#snippet actions()}
          <BottomSheet.CloseButton onclick={onClose} />
        {/snippet}
      </BottomSheet.Header>
    {/snippet}

    {#each timetable.data ?? [] as schedule (`${schedule.route.id}-${schedule.direction.id}-${schedule.stop.id}`)}
      <p>
        {schedule.route.name} - {schedule.direction.name} - {schedule.stop.name}: {moment(
          schedule.timetable[0].scheduledTime,
        ).format('hh:mm A')}
      </p>
    {/each}
  </BottomSheet.Root>
{/key}
