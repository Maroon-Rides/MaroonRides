<script lang="ts">
  import * as Item from '$lib/components/ui/item';
  import { PlanOption } from '$lib/data/types';
  import { ChevronRight } from '@lucide/svelte';

  type Props = {
    icon: PlanOption;
    title: string;
    subtitle?: string;
    sideArrow?: boolean;
    onclick?: (e: MouseEvent) => any;
  };

  let { icon, title, subtitle, sideArrow, onclick }: Props = $props();
  const Icon = $derived(PlanOption.getIcon(icon));
</script>

<div role="listitem">
  <Item.Root>
    {#snippet child({ props })}
      <button {...props} {onclick}>
        <Item.Media class="size-10 rounded-full bg-muted">
          <Icon
            class="size-6 {icon === PlanOption.MY_LOCATION
              ? 'text-blue-500'
              : 'text-muted-foreground'}"
          />
        </Item.Media>
        <Item.Content class="min-w-0 text-left">
          <Item.Title class="w-full text-base font-semibold">{title}</Item.Title>
          {#if subtitle}
            <Item.Description>{subtitle}</Item.Description>
          {/if}
        </Item.Content>
        {#if sideArrow}
          <Item.Actions>
            <ChevronRight class="size-5 text-muted-foreground" />
          </Item.Actions>
        {/if}
      </button>
    {/snippet}
  </Item.Root>
</div>
