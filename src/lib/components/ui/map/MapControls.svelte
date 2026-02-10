<script lang="ts">
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
  let isCentered = $state(false);
  const loaded = $derived(mapCtx.isLoaded());

  const positionClasses = {
    'top-left': 'top-16 left-2',
    'top-right': 'top-16 right-2',
    'bottom-left': 'bottom-2 left-2',
    'bottom-right': 'bottom-10 right-2',
  };

  $effect(() => {
    const map = mapCtx.getMap();

    if (!loaded || !map) return;

    map.on('rotate', () => (isCentered = false));
    map.on('pitch', () => (isCentered = false));
    map.on('dragstart', () => (isCentered = false));

    return () => {
      map.off('rotate', () => (isCentered = false));
      map.off('pitch', () => (isCentered = false));
      map.off('dragstart', () => (isCentered = false));
    };
  });

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
      isCentered = true;

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
      {#if isCentered}
        <LocateFixed class="size-6 stroke-muted-foreground" />
      {:else}
        <Locate class="size-6 stroke-muted-foreground" />
      {/if}
    </Button>
  </div>
{/if}
