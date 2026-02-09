<script lang="ts">
  import { page } from '$app/state';
  import BusRow from '$lib/components/BusRow.svelte';
  import * as BottomSheet from '$lib/components/ui/bottom-sheet';
  import Button from '$lib/components/ui/button/button.svelte';
  import * as Card from '$lib/components/ui/card';
  import Spinner from '$lib/components/ui/spinner/spinner.svelte';
  import * as Tabs from '$lib/components/ui/tabs';
  import { useRoutes } from '$lib/data/app';
  import { Cog, Route } from 'lucide-svelte';

  let routes = useRoutes();

  let selectedTab = $state('all');
</script>

{#key page.url.pathname}
  <BottomSheet.Root initialSnapIndex={1}>
    {#snippet header()}
      <BottomSheet.Header title="Routes">
        {#snippet actions()}
          <div class="flex items-center gap-2">
            <Button variant="outline" class="rounded-full" aria-label="Plan Route" size="md">
              <Route />
              Plan Route
            </Button>
            <Button variant="outline" class="rounded-full" aria-label="Settings" size="icon-md">
              <Cog />
            </Button>
          </div>
        {/snippet}

        <Tabs.Root bind:value={selectedTab} class="mt-2">
          <Tabs.List>
            <Tabs.Trigger value="all">All Routes</Tabs.Trigger>
            <Tabs.Trigger value="favorites">Favorites</Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
      </BottomSheet.Header>
    {/snippet}

    {#if selectedTab === 'all'}
      <Card.Content class="flex flex-col gap-3 px-4 pt-4 pb-10">
        {#if routes.isLoading}
          <Spinner />
        {:else if routes.isError}
          <p>Error loading routes: {routes.error.message}</p>
        {/if}

        {#each routes.data ?? [] as route}
          <BusRow
            id={route.id}
            busNumber={route.routeCode}
            routeColor={route.tintColor}
            title={route.name}
            endpoints={route.directions}
          />
        {/each}
      </Card.Content>
    {:else if selectedTab === 'favorites'}
      <Card.Content class="flex flex-col gap-3 pt-4 pb-10">
        <p>Favorites coming soon!</p>
      </Card.Content>
    {/if}
  </BottomSheet.Root>
{/key}
