<script lang="ts">
  import BusRow from '$lib/components/BusRow.svelte';
  import Button from '$lib/components/ui/button/button.svelte';
  import * as Card from '$lib/components/ui/card';
  import * as Tabs from '$lib/components/ui/tabs';
  import { Cog, Route } from 'lucide-svelte';
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
        <BusRow
          id="01"
          busNumber="01"
          routeColor="#FF0000"
          title="Route 1"
          endpoints={['Start', 'End']}
        />
        <BusRow
          id="02"
          busNumber="02"
          routeColor="#00FF00"
          title="Route 2"
          endpoints={['Start', 'End']}
        />
        <BusRow
          id="03"
          busNumber="03"
          routeColor="#0000FF"
          title="Route 3"
          endpoints={['Start', 'End']}
        />
      </Tabs.Content>
      <Tabs.Content value="favorites">Change your password here.</Tabs.Content>
    </Tabs.Root>
  </Card.Content>
</Card.Root>
