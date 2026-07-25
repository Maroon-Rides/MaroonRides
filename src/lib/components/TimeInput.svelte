<script lang="ts">
  import { Input } from '$lib/components/ui/input';
  import { DateTime } from 'luxon';

  type Props = {
    value: DateTime;
    onchange: (dt: DateTime) => void;
  };

  let { value, onchange }: Props = $props();

  function handleInput(e: Event) {
    const [hour, minute] = (e.currentTarget as HTMLInputElement).value.split(':').map(Number);
    if (Number.isNaN(hour) || Number.isNaN(minute)) return;
    onchange(value.set({ hour, minute }));
  }
</script>

<Input
  type="time"
  value={value.toFormat('HH:mm')}
  oninput={handleInput}
  onmousedown={(e) => e.stopPropagation()}
  class="w-auto appearance-none tabular-nums [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
/>
