<script lang="ts">
  import * as Accordion from '$lib/components/ui/accordion';
  import { Badge } from '$lib/components/ui/badge';
  import { PlanOption, type WalkingInstruction } from '$lib/data/types';
  import { cn } from '$lib/utils';
  import InstructionsList from './InstructionsList.svelte';

  type Props = {
    value: string;
    icon: PlanOption;
    time: string;
    content: string;
    instructions: WalkingInstruction[];
    isFirst?: boolean;
    isLast?: boolean;
  };
  let {
    value,
    icon,
    time,
    content,
    instructions,
    isLast = false,
    isFirst = false,
  }: Props = $props();

  const Icon = $derived(PlanOption.getIcon(icon));
</script>

<Accordion.Item {value} class="flex items-stretch gap-3 text-left not-last:border-b-0">
  <!-- time pill column -->
  <div class="-ml-1 flex w-20 shrink-0 items-start justify-end pt-2">
    <Badge variant="secondary" class="h-auto w-full justify-center py-1 font-semibold">
      {time}
    </Badge>
  </div>
  <!-- timeline / icon column -->
  <div class="relative flex w-8 shrink-0 flex-col items-center">
    <div
      class="z-10 mt-1 flex size-8 items-center justify-center rounded-full border-2 border-border bg-muted"
    >
      <Icon class="size-4 text-muted-foreground" />
    </div>
    {#if !isFirst}
      <div class="absolute top-0 left-1/2 h-1 w-0.5 -translate-x-1/2 bg-border"></div>
    {/if}
    {#if !isLast}
      <div class="absolute top-9 bottom-0 left-1/2 w-0.5 -translate-x-1/2 bg-border"></div>
    {/if}
  </div>
  <!-- content column -->
  <div class="flex flex-1 flex-col">
    <Accordion.Trigger
      class={cn(
        'items-center gap-2 font-normal no-underline hover:no-underline **:data-[slot=accordion-trigger-icon]:size-5',
        !instructions.length && '**:data-[slot=accordion-trigger-icon]:hidden!',
      )}
    >
      <span>{@html content}</span>
    </Accordion.Trigger>
    {#if instructions.length}
      <Accordion.Content>
        <InstructionsList {instructions} />
      </Accordion.Content>
    {/if}
  </div>
</Accordion.Item>
