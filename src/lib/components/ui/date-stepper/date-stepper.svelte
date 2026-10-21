<script lang="ts">
  import * as ButtonGroup from '$lib/components/ui/button-group/index.js';
  import { ArrowLeft, ArrowRight } from '@lucide/svelte';
  import { DateTime } from 'luxon';
  import Button from '../button/button.svelte';

  const DATE_FORMAT = 'ccc, LLL d';

  type Props = {
    selectedDate: DateTime;
    minDate?: DateTime;
    maxDate?: DateTime;
    class?: string;
  };

  let {
    selectedDate = $bindable(DateTime.now()),
    minDate,
    maxDate,
    class: className,
  }: Props = $props();

  function offsetDate(days: number) {
    selectedDate = selectedDate.plus({ days });
  }
</script>

<ButtonGroup.Root class={className}>
  <Button
    variant="outline"
    size="sm"
    class="mt-2 rounded-full"
    onclick={() => offsetDate(-1)}
    disabled={minDate ? selectedDate.startOf('day') <= minDate.startOf('day') : false}
  >
    <ArrowLeft />
  </Button>
  <Button variant="outline" size="sm" class="mt-2 min-w-32 rounded-full">
    {selectedDate.toFormat(DATE_FORMAT)}
  </Button>

  <Button
    variant="outline"
    size="sm"
    class="mt-2 rounded-full "
    onclick={() => offsetDate(1)}
    disabled={maxDate ? selectedDate.startOf('day') >= maxDate.startOf('day') : false}
  >
    <ArrowRight />
  </Button>
</ButtonGroup.Root>
