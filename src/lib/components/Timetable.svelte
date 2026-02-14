<script lang="ts">
  import { useTimetableEstimate } from '$lib/data/app';
  import type { StopSchedule } from '$lib/data/types';
  import buildTimetable from '$lib/utils/timetable';
  import { Rss } from 'lucide-svelte';
  import { tv } from 'tailwind-variants';

  type Props = {
    schedule: StopSchedule;
    date: moment.Moment;
  };

  let { schedule, date }: Props = $props();

  const timeEstimates = useTimetableEstimate(() => ({ stop: schedule.stop, date }));
  const timetable = $derived(buildTimetable(schedule, timeEstimates.data ?? []));

  const rowStyle = tv({
    base: 'flex items-center rounded-lg',
    variants: {
      index: {
        even: 'bg-muted',
        odd: '',
      },
    },
  });

  const cellStyle = tv({
    base: 'flex w-[20%] items-center justify-center py-2',
    variants: {
      cancelled: {
        true: 'line-through',
        false: '',
      },
      live: {
        true: 'font-bold',
        false: '',
      },
    },
  });
</script>

<div class="flex flex-col">
  {#each timetable as row, i}
    <div class={rowStyle({ index: i % 2 == 0 ? 'even' : 'odd' })}>
      {#each row.items as item}
        <div class={cellStyle({ cancelled: item.cancelled, live: item.live })}>
          <p>{item.time}</p>
          {#if item.live}
            <Rss class="-mt-2 size-3.5 ps-1" />
          {/if}
        </div>
      {/each}
    </div>
  {/each}
</div>
