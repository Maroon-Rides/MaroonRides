<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import RouteRow from '$lib/components/RouteRow.svelte';
  import * as BottomSheet from '$lib/components/ui/bottom-sheet';
  import Button from '$lib/components/ui/button/button.svelte';
  import * as Card from '$lib/components/ui/card';
  import Spinner from '$lib/components/ui/spinner/spinner.svelte';
  import * as Tabs from '$lib/components/ui/tabs';
  import { useRoutes } from '$lib/data/app';
  import { mapManager } from '$lib/managers/map.manager.svelte';
  import { Preferences } from '@capacitor/preferences';
  import { Cog, Route } from 'lucide-svelte';
  import { onMount } from 'svelte';

  let routes = useRoutes();
  let selectedTab = $state('all');
  let favorites: string[] = $state([]);

  $effect(() => {
    mapManager.setDrawnRoutes(routes.data ?? []);
  });

  onMount(async () => {
    selectedTab = (await Preferences.get({ key: 'defaultGroup' })).value ?? 'all';
    favorites = JSON.parse((await Preferences.get({ key: 'favorites' })).value ?? '[]');
  });
</script>

{#key page.url.pathname}
  <BottomSheet.Root initialSnapIndex={1}>
    {#snippet header()}
      <BottomSheet.Header title="Routes">
        {#snippet actions()}
          <div class="pointer-events-auto flex items-center gap-2">
            <Button
              variant="outline"
              class="rounded-full"
              aria-label="Plan Route"
              size="md"
              onclick={() => console.log('Plan route')}
            >
              <Route />
              Plan Route
            </Button>
            <Button
              variant="outline"
              class="rounded-full"
              aria-label="Settings"
              size="icon-md"
              onclick={() => goto('/settings')}
            >
              <Cog />
            </Button>
          </div>
        {/snippet}

        <Tabs.Root bind:value={selectedTab} class="mt-1">
          <Tabs.List>
            <Tabs.Trigger value="all">All Routes</Tabs.Trigger>
            <Tabs.Trigger value="favorites">Favorites</Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
      </BottomSheet.Header>
    {/snippet}

    {#if selectedTab === 'all'}
      <Card.Content class="flex flex-col gap-4 px-4 pt-4 pb-10">
        {#if routes.isLoading}
          <Spinner class="size-6 self-center" />
        {:else if routes.isError}
          <p>Error loading routes: {routes.error.message}</p>
        {/if}

        {#each routes.data ?? [] as route}
          <RouteRow {route} onclick={() => goto(`/route/${route.id}`)} />
        {/each}
      </Card.Content>
    {:else if selectedTab === 'favorites'}
      <Card.Content class="flex flex-col gap-4 px-4 pt-4 pb-10">
        {@const favRoutes =
          routes.data?.filter((route) => favorites.includes(route.routeCode)) ?? []}
        {#if favRoutes.length === 0 && !routes.isLoading}
          <p class="text-center text-sm text-muted-foreground">There are no favorited routes.</p>
        {/if}

        {#if routes.isLoading}
          <Spinner class="size-6 self-center" />
        {/if}

        {#each favRoutes as route}
          <RouteRow {route} onclick={() => goto(`/route/${route.id}`)} />
        {/each}
      </Card.Content>
    {/if}
  </BottomSheet.Root>
{/key}
