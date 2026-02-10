<script lang="ts">
  import { mapManager } from '$lib/managers/map.manager.svelte';
  import { cn } from '$lib/utils.js';
  import { Geolocation } from '@capacitor/geolocation';
  import { Locate, LocateFixed } from 'lucide-svelte';
  import { getContext } from 'svelte';
  import Button from '../button/button.svelte';
  import type { MapContext } from './Map.svelte';
  interface Props {
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    showZoom?: boolean;
    showCompass?: boolean;
    showLocate?: boolean;
    showFullscreen?: boolean;
    class?: string;
    onlocate?: (coords: { longitude: number; latitude: number }) => void;
  }

  let { position = 'top-right', class: className, onlocate }: Props = $props();

  const mapCtx = getContext<MapContext>('map');

  let waitingForLocation = $state(false);
  const loaded = $derived(mapCtx.isLoaded());

  const positionClasses = {
    'top-left': 'top-16 left-2',
    'top-right': 'top-16 right-2',
    'bottom-left': 'bottom-2 left-2',
    'bottom-right': 'bottom-10 right-2',
  };

  async function handleLocate() {
    const map = mapCtx.getMap();
    if (!map) return;

    waitingForLocation = true;

    try {
      const location = await Geolocation.getCurrentPosition();
      const coords = {
        longitude: location.coords.longitude,
        latitude: location.coords.latitude,
      };
      map.flyTo({
        center: [coords.longitude, coords.latitude - 0.003], // offset to account for UI
        zoom: 15,
        duration: 750,
        bearing: 0,
      });
      mapManager.isCentered = true;

      onlocate?.(coords);
    } catch (error) {
      console.error('Error getting location:', error);
      return;
    } finally {
      waitingForLocation = false;
    }
  }
</script>

{#if loaded}
  <div class={cn('absolute z-10 flex flex-col gap-1.5', positionClasses[position], className)}>
    <Button
      variant="outline"
      size="icon-xl"
      onclick={handleLocate}
      aria-label="Locate"
      class="dark:bg-card"
    >
      {#if mapManager.isCentered}
        <LocateFixed class="size-6 stroke-muted-foreground" />
      {:else}
        <Locate class="size-6 stroke-muted-foreground" />
      {/if}
    </Button>
  </div>
{/if}
