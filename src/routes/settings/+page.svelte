<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import * as BottomSheet from '$lib/components/ui/bottom-sheet';
  import Separator from '$lib/components/ui/separator/separator.svelte';
  import * as Tabs from '$lib/components/ui/tabs';
  import { mapManager } from '$lib/managers/map.manager.svelte';
  import { Preferences } from '@capacitor/preferences';
  import { setMode, userPrefersMode } from 'mode-watcher';
  import { onMount } from 'svelte';

  let theme = $state(userPrefersMode.current);
  let defaultRouteGroup = $state('all');

  $effect(() => {
    Preferences.set({ key: 'defaultGroup', value: defaultRouteGroup == 'all' ? '0' : '1' });
  });

  onMount(async () => {
    const defaultGroup = await Preferences.get({ key: 'defaultGroup' }).then((res) => res.value);
    console.log('Loaded default group:', defaultGroup);
    if (defaultGroup === '1') {
      defaultRouteGroup = 'favorites';
    }
  });

  function onClose() {
    goto(`/`);
  }
</script>

{#key page.url.pathname}
  <BottomSheet.Root
    initialSnapIndex={0}
    snapPoints={[
      { height: 45, id: 'm' },
      { height: 80, id: 'l' },
    ]}
  >
    {#snippet header()}
      <BottomSheet.Header title="Settings">
        {#snippet actions()}
          <BottomSheet.CloseButton onclick={onClose} />
        {/snippet}
      </BottomSheet.Header>
    {/snippet}
    <div class="flex flex-col gap-2 px-4 py-2">
      <div>
        <h3 class="text-lg font-semibold">Default Route Group</h3>
        <p class="text-sm text-muted-foreground">
          Choose the default route group to display when the app opens
        </p>
        <Tabs.Root bind:value={defaultRouteGroup} class="mt-1">
          <Tabs.List>
            <Tabs.Trigger value="all">All</Tabs.Trigger>
            <Tabs.Trigger value="favorites">Favorites</Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
      </div>
      <div>
        <h3 class="text-lg font-semibold">App Theme</h3>
        <p class="text-sm text-muted-foreground">Select your preferred theme for the app.</p>
        <Tabs.Root bind:value={theme} class="mt-1">
          <Tabs.List>
            <Tabs.Trigger value="system" onclick={() => setMode('system')}>System</Tabs.Trigger>
            <Tabs.Trigger value="light" onclick={() => setMode('light')}>Light</Tabs.Trigger>
            <Tabs.Trigger value="dark" onclick={() => setMode('dark')}>Dark</Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
      </div>
      <Separator class="mt-4" />
      <p class="text-xs text-muted-foreground">
        Made with ❤️ by fellow Aggies. Gig 'em!
        <br />
        Map data provided by: {@html mapManager.attribution}
      </p>
    </div>
  </BottomSheet.Root>
{/key}
