<script lang="ts">
  import { useTimetableEstimate } from '$lib/data/app';
  import type { StopSchedule } from '$lib/data/types';
  import { themeManager } from '$lib/managers/theme.manager.svelte';
  import buildTimetable from '$lib/utils/timetable';
  import { getRouteTint } from '$lib/utils/tints';
  import { Rss } from 'lucide-svelte';
  import { tv } from 'tailwind-variants';

  type Props = {
    schedule: StopSchedule;
    date: moment.Moment;
  };

  let { schedule, date }: Props = $props();

  const timeEstimates = useTimetableEstimate(() => ({ stop: schedule.stop, date }));
  const timetable = $derived(buildTimetable(schedule, timeEstimates.data ?? []));
  const tintColor = $derived(getRouteTint(schedule.route, themeManager.theme));

  const rowStyle = tv({
    base: 'flex items-center rounded-lg',
    variants: {
      index: {
        even: 'bg-muted',
        odd: 'bg-transparent',
      },
      highlighted: {
        true: 'bg-[var(--tint)]/25',
      },
    },
  });

  const cellStyle = tv({
    base: 'flex w-[20%] items-center justify-center rounded-md py-2',
    variants: {
      cancelled: {
        true: 'line-through',
      },
      expired: {
        true: 'text-muted-foreground',
      },
      highlighted: {
        true: 'font-bold text-[var(--tint)]',
      },
    },
  });
</script>

<div class="flex flex-col" style="--tint: {tintColor}">
  {#each timetable as row, i}
    <div
      class={rowStyle({
        index: i % 2 == 0 ? 'even' : 'odd',
        highlighted: row.highlighted,
      })}
    >
      {#each row.items as item}
        <div
          class={cellStyle({
            cancelled: item.cancelled,
            expired: item.expired,
            highlighted: item.highlighted,
          })}
        >
          <p>{item.time}</p>
          {#if item.live}
            <Rss class="mt-1 -mr-2.5 ml-0.5 size-2 self-start stroke-4" />
          {/if}
        </div>
      {/each}
    </div>
  {/each}
</div>
