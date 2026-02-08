<script lang="ts">
  import BusRow from '$lib/components/BusRow.svelte';
  import Button from '$lib/components/ui/button/button.svelte';
  import * as Card from '$lib/components/ui/card';
  import Spinner from '$lib/components/ui/spinner/spinner.svelte';
  import * as Tabs from '$lib/components/ui/tabs';
  import { useRoutes } from '$lib/data/app';
  import { Cog, Route } from 'lucide-svelte';

  let routes = useRoutes();
</script>

<Card.Root class="pointer-events-auto w-full gap-2 px-6 md:w-sm">
  <Card.Header>
    <Card.Title class="text-3xl">Routes</Card.Title>
    <Card.Action>
      <Button variant="outline" class="rounded-full" aria-label="Plan Route" size="sm">
        <Route />
        Plan Route
      </Button>
      <Button variant="outline" class="rounded-full" aria-label="Settings" size="icon">
        <Cog />
      </Button>
    </Card.Action>
    <!-- divider -->
  </Card.Header>
  <Card.Content>
    <Tabs.Root value="all" class="w-full">
      <Tabs.List>
        <Tabs.Trigger value="all">All Routes</Tabs.Trigger>
        <Tabs.Trigger value="favorites">Favorites</Tabs.Trigger>
      </Tabs.List>
      <div class="h-px w-full bg-border"></div>
      <Tabs.Content value="all" class="flex flex-col gap-3 pt-2">
        {#if routes.isLoading}
          <Spinner />
        {:else if routes.isError}
          <p>Error loading routes: {routes.error.message}</p>
        {/if}

        {#each routes.data ?? [] as route}
          <BusRow
            id="01"
            busNumber="01"
            routeColor="#FF0000"
            title="Route 1"
            endpoints={['Start', 'End']}
          />
        {/each}
      </Tabs.Content>
      <Tabs.Content value="favorites">Change your password here.</Tabs.Content>
    </Tabs.Root>
  </Card.Content>
</Card.Root>
