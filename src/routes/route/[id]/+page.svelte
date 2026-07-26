<script lang="ts">
  import StopRow from './StopRow.svelte';

  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import RouteBubble from '$lib/components/RouteBubble.svelte';
  import * as BottomSheet from '$lib/components/ui/bottom-sheet';
  import Button from '$lib/components/ui/button/button.svelte';
  import * as Tabs from '$lib/components/ui/tabs';
  import Toggle from '$lib/components/ui/toggle/toggle.svelte';
  import { useAlerts, useRoutes } from '$lib/data/app';
  import { mapManager } from '$lib/managers/map.manager.svelte';
  import { toggleFavorite } from '$lib/utils/prefs';
  import { Preferences } from '@capacitor/preferences';
  import { Bell, BellRing, Star } from '@lucide/svelte';
  import { onMount, untrack } from 'svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const routes = useRoutes();
  const route = $derived(routes.data?.find((r) => r.id === data.routeId) ?? null);
  const alerts = useAlerts(() => ({ route }));
  let isFavorite = $state(false);
  const selectedDirection = $derived(
    route?.directions.find((d) => d.id === mapManager.selectedDirectionId) ?? null,
  );

  onMount(async () => {
    const favoritedRoutes = JSON.parse(
      (await Preferences.get({ key: 'favorites' })).value ?? '[]',
    ) as string[];

    isFavorite = favoritedRoutes.includes(route?.routeCode ?? '');
  });

  $effect(() => {
    mapManager.setSelectedRoute(route);
    untrack(() => {
      mapManager.selectedDirectionId = route?.directions[0].id ?? '';
    });
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

        <div class="mb-1 flex flex-row gap-1">
          <Toggle
            variant="outline"
            size="md"
            class="rounded-full data-[state=on]:bg-transparent dark:bg-muted data-[state=on]:*:[svg]:fill-yellow-500 data-[state=on]:*:[svg]:stroke-yellow-500"
            onclick={() => toggleFavorite(route?.routeCode ?? '')}
            bind:pressed={isFavorite}
          >
            <Star class="size-4" />
            Favorite
          </Toggle>
          <Button
            variant="outline"
            size="md"
            class="rounded-full"
            onclick={() => goto(`/route/${route?.id}/alerts`)}
          >
            {#if alerts.data?.length ?? 0 > 0}
              <BellRing class="size-4" />
            {:else}
              <Bell class="size-4" />
            {/if}
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
    {#if selectedDirection && route}
      <div class="pb-4">
        {#each selectedDirection?.stops ?? [] as stop, i (`${stop.id}-${selectedDirection?.id}-${i}`)}
          {@const isLast = i === (selectedDirection?.stops.length ?? 0) - 1}
          {@const altDirection = isLast
            ? route.directions.length > 1
              ? (route.directions.find((d) => d.id !== selectedDirection.id) ?? selectedDirection)
              : selectedDirection
            : selectedDirection}
          <StopRow
            {stop}
            direction={selectedDirection}
            {route}
            estimateDirection={isLast ? altDirection : undefined}
            estimateStop={isLast ? altDirection?.stops[0] : undefined}
          />
          {#if i < (selectedDirection?.stops.length ?? 0) - 1}
            <hr class="ml-4" />
          {/if}
        {/each}
      </div>
    {/if}
  </BottomSheet.Root>
{/key}
