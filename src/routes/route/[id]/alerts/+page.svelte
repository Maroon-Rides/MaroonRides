<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import * as BottomSheet from '$lib/components/ui/bottom-sheet';
  import { useAlerts, useRoutes } from '$lib/data/app';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const routes = useRoutes();
  const route = $derived(routes.data?.find((r) => r.id === data.routeId) ?? null);
  const alerts = $derived(useAlerts(route));

  function onClose() {
    goto(`/route/${route?.id}`);
  }
</script>

{#key page.url.pathname}
  <BottomSheet.Root initialSnapIndex={1}>
    {#snippet header()}
      <BottomSheet.Header title="Alerts" subtitle={route?.name}>
        {#snippet actions()}
          <BottomSheet.CloseButton onclick={onClose} />
        {/snippet}
      </BottomSheet.Header>
    {/snippet}
  </BottomSheet.Root>
{/key}
