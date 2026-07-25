<script lang="ts">
  import { Input } from '$lib/components/ui/input';
  import { PlaceType } from '$lib/data/types';
  import { cn } from '$lib/utils';
  import { LocateFixed } from '@lucide/svelte';
  import type { FocusEventHandler, FormEventHandler } from 'svelte/elements';

  type Props = {
    value: string;
    location?: PlaceType;
    component: any;
    oninput: FormEventHandler<HTMLInputElement>;
    onfocus: FocusEventHandler<HTMLInputElement>;
  };

  let { location, component, oninput, onfocus, value = $bindable() }: Props = $props();

  const isMyLocation = $derived(location === PlaceType.MY_LOCATION);
</script>

<div class="flex items-center gap-3">
  <div class="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
    {#if isMyLocation}
      <LocateFixed class="size-5 text-blue-500" />
    {:else}
      {@const Component = component}
      <Component class="size-5 text-muted-foreground" />
    {/if}
  </div>
  <Input
    type="text"
    placeholder="Enter a Location"
    class={cn('flex-1', isMyLocation && 'text-blue-500')}
    onmousedown={(e) => e.stopPropagation()}
    bind:value
    {oninput}
    {onfocus}
  />
</div>
