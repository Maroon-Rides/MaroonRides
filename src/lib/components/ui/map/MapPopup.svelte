<script lang="ts">
  import { cn } from '$lib/utils.js';
  import X from '@lucide/svelte/icons/x';
  import MapLibreGL, { type PopupOptions } from 'maplibre-gl';
  import { getContext } from 'svelte';
  import type { MapContext } from './Map.svelte';
  import type { MarkerContext } from './MapMarker.svelte';

  interface Props {
    longitude: number;
    latitude: number;
    children?: import('svelte').Snippet;
    class?: string;
    closeButton?: boolean;
    onclose?: () => void;
    offset?: PopupOptions['offset'];
    anchor?: PopupOptions['anchor'];
    closeOnClick?: boolean;
    closeOnMove?: boolean;
    focusAfterOpen?: boolean;
    maxWidth?: string;
  }

  let {
    longitude,
    latitude,
    children,
    class: className,
    closeButton = false,
    onclose,
    offset = 16,
    anchor,
    closeOnClick,
    closeOnMove,
    focusAfterOpen,
    maxWidth,
  }: Props = $props();

  const mapCtx = getContext<MapContext>('map');
  const markerCtx = getContext<MarkerContext>('marker') || {};

  let popup: MapLibreGL.Popup | null = null;
  let wrapperElement: HTMLDivElement | null = $state(null);

  // Create popup when map is ready
  $effect(() => {
    const map = mapCtx.getMap();
    const loaded = mapCtx.isLoaded();

    if (!loaded || !map || !wrapperElement) return;

    // Validate coordinates
    if (
      typeof longitude !== 'number' ||
      typeof latitude !== 'number' ||
      Number.isNaN(longitude) ||
      Number.isNaN(latitude)
    ) {
      return;
    }

    // Create popup container
    const container = document.createElement('div');

    // Build popup options
    const popupOptions: PopupOptions = {
      offset,
      closeButton: false,
      className: 'maplibre-popup-transparent',
    };

    // If marker is draggable, preserve popup state during movement
    if (markerCtx.isDraggable?.()) {
      popupOptions.closeOnMove = false;
    }

    if (anchor !== undefined) popupOptions.anchor = anchor;
    if (closeOnClick !== undefined) popupOptions.closeOnClick = closeOnClick;
    if (closeOnMove !== undefined) popupOptions.closeOnMove = closeOnMove;
    if (focusAfterOpen !== undefined) popupOptions.focusAfterOpen = focusAfterOpen;

    // Create popup
    const popupInstance = new MapLibreGL.Popup(popupOptions)
      .setDOMContent(container)
      .setLngLat([longitude, latitude])
      .addTo(map);

    if (maxWidth) {
      popupInstance.setMaxWidth(maxWidth);
    } else {
      popupInstance.setMaxWidth('none');
    }

    popup = popupInstance;

    // Handle close event
    const handleClose = () => onclose?.();
    popupInstance.on('close', handleClose);

    // Move content to popup container
    while (wrapperElement.firstChild) {
      container.appendChild(wrapperElement.firstChild);
    }

    return () => {
      popupInstance.off('close', handleClose);

      // Move content back
      while (container.firstChild) {
        wrapperElement?.appendChild(container.firstChild);
      }

      if (popupInstance.isOpen()) {
        popupInstance.remove();
      }
      popup = null;
    };
  });

  // Update position when coordinates change
  $effect(() => {
    if (
      popup &&
      typeof longitude === 'number' &&
      typeof latitude === 'number' &&
      !Number.isNaN(longitude) &&
      !Number.isNaN(latitude)
    ) {
      popup.setLngLat([longitude, latitude]);
    }
  });

  function handleClose() {
    popup?.remove();
    onclose?.();
  }
</script>

<div bind:this={wrapperElement} style="display: contents;">
  <div
    class={cn(
      'relative animate-in rounded-md border bg-popover p-3 text-popover-foreground shadow-md fade-in-0 zoom-in-95',
      className,
    )}
  >
    {#if closeButton}
      <button
        type="button"
        onclick={handleClose}
        class="absolute top-1 right-1 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none"
        aria-label="Close popup"
      >
        <X class="h-4 w-4" />
        <span class="sr-only">Close</span>
      </button>
    {/if}
    {@render children?.()}
  </div>
</div>

<style>
  :global(.maplibre-popup-transparent .maplibregl-popup-content) {
    background: transparent;
    box-shadow: none;
    padding: 0;
  }

  :global(.maplibre-popup-transparent .maplibregl-popup-tip) {
    display: none;
  }
</style>
