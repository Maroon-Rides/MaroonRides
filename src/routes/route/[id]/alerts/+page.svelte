<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import * as BottomSheet from '$lib/components/ui/bottom-sheet';
  import * as Card from '$lib/components/ui/card';
  import Separator from '$lib/components/ui/separator/separator.svelte';
  import Spinner from '$lib/components/ui/spinner/spinner.svelte';
  import { useAlerts, useRoutes } from '$lib/data/app';
  import { TriangleAlert } from 'lucide-svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const routes = useRoutes();
  const route = $derived(routes.data?.find((r) => r.id === data.routeId) ?? null);
  const alerts = useAlerts(() => ({ route }));

  function onClose() {
    goto(`/route/${route?.id}`);
  }

  const descriptionClasses =
    'mt-3 [&_h6]:my-2 [&_h6]:text-xl [&_h6]:font-bold [&_p]:my-1 [&_span]:font-bold [&_ul]:ms-4 [&_ul]:list-inside [&_ul]:list-disc';
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

    <div class="flex flex-col gap-4 px-4 pt-4 pb-8">
      {#if alerts.isLoading}
        <Spinner class="size-6 self-center" />
      {:else if alerts.data?.length === 0}
        <p class="text-center text-sm text-muted-foreground">
          There are no active alerts for this route.
        </p>
      {/if}

      {#each alerts.data as alert}
        <Card.Root class="border-amber-400 bg-amber-400/10">
          <Card.Content class="p-4 px-4">
            <div class="flex items-center gap-3">
              <TriangleAlert class="size-12 text-amber-400" />
              <p class="text-sm font-bold">{alert.title}</p>
            </div>
            <Separator class="my-3 bg-amber-400/30" />
            <div class={descriptionClasses}>
              {@html alert.description}
            </div>
          </Card.Content>
        </Card.Root>
      {/each}
    </div>
  </BottomSheet.Root>
{/key}
