<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import * as BottomSheet from '$lib/components/ui/bottom-sheet';
  import * as Tabs from '$lib/components/ui/tabs';
  import { setMode, userPrefersMode } from 'mode-watcher';

  let theme = $state(userPrefersMode.current);
  let defaultRouteGroup = $state('all');

  function onClose() {
    goto(`/`);
  }
</script>

{#key page.url.pathname}
  <BottomSheet.Root initialSnapIndex={1}>
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
            <Tabs.Trigger value="light" onclick={() => setMode('light')}>Light</Tabs.Trigger>
            <Tabs.Trigger value="dark" onclick={() => setMode('dark')}>Dark</Tabs.Trigger>
            <Tabs.Trigger value="system" onclick={() => setMode('system')}>System</Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
      </div>
    </div>
  </BottomSheet.Root>
{/key}
