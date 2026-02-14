<script lang="ts">
  import * as ButtonGroup from '$lib/components/ui/button-group/index.js';
  import { ArrowLeft, ArrowRight } from 'lucide-svelte';
  import moment from 'moment';
  import Button from '../button/button.svelte';

  type Props = {
    selectedDate: moment.Moment;
    minDate?: moment.Moment;
    maxDate?: moment.Moment;
    class?: string;
  };

  let { selectedDate = $bindable(moment()), minDate, maxDate, class: className }: Props = $props();

  function offsetDate(days: number) {
    selectedDate = selectedDate.clone().add(days, 'day');
  }
</script>

<ButtonGroup.Root class={className}>
  <Button
    variant="outline"
    size="sm"
    class="mt-2 rounded-full"
    onclick={() => offsetDate(-1)}
    disabled={minDate ? selectedDate.isSameOrBefore(minDate ?? moment(), 'day') : false}
  >
    <ArrowLeft />
  </Button>
  <Button variant="outline" size="sm" class="mt-2 w-32 rounded-full">
    {selectedDate.format('ddd, MMM D')}
  </Button>

  <Button
    variant="outline"
    size="sm"
    class="mt-2 rounded-full "
    onclick={() => offsetDate(1)}
    disabled={maxDate ? selectedDate.isSameOrAfter(maxDate ?? moment(), 'day') : false}
  >
    <ArrowRight />
  </Button>
</ButtonGroup.Root>
