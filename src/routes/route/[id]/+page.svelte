<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import RouteBubble from '$lib/components/RouteBubble.svelte';
  import * as BottomSheet from '$lib/components/ui/bottom-sheet';
  import Button from '$lib/components/ui/button/button.svelte';
  import * as Tabs from '$lib/components/ui/tabs';
  import Toggle from '$lib/components/ui/toggle/toggle.svelte';
  import { useRoutes } from '$lib/data/app';
  import { mapManager } from '$lib/managers/map.manager.svelte';
  import { Bell, Star } from 'lucide-svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const routes = useRoutes();
  const route = $derived(routes.data?.find((r) => r.id === data.routeId) ?? null);

  $effect(() => {
    mapManager.setSelectedRoute(route);
    mapManager.selectedDirectionId = route?.directions[0].id ?? '';
  });

  function onClose() {
    goto('/');
    mapManager.setSelectedRoute(null);
    mapManager.selectedDirectionId = '';
  }
</script>

{#key page.url.pathname}
  <BottomSheet.Root initialSnapIndex={1}>
    {#snippet header()}
      <BottomSheet.Header title={route?.name ?? 'Route'}>
        {#snippet leading()}
          {#if route}
            <RouteBubble {route} />
          {/if}
        {/snippet}

        {#snippet actions()}
          <BottomSheet.CloseButton onclick={onClose} />
        {/snippet}

        <div class="my-1 flex flex-row gap-1">
          <Toggle
            variant="outline"
            size="md"
            class="rounded-full data-[state=on]:bg-transparent dark:bg-muted data-[state=on]:*:[svg]:fill-yellow-500 data-[state=on]:*:[svg]:stroke-yellow-500"
          >
            <Star class="size-4" />
            Favorite
          </Toggle>
          <Button variant="outline" size="md" class="rounded-full" onclick={() => goto('/')}>
            <Bell class="size-4" />
            Alerts
          </Button>
        </div>

        {#if (route?.directions.length ?? 1) > 1}
          <Tabs.Root bind:value={mapManager.selectedDirectionId} class="w-full">
            <Tabs.List>
              {#each route?.directions as direction}
                <Tabs.Trigger value={direction.id}>{direction.name}</Tabs.Trigger>
              {/each}
            </Tabs.List>
          </Tabs.Root>
        {/if}
      </BottomSheet.Header>
    {/snippet}
  </BottomSheet.Root>
{/key}
