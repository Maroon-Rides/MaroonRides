<script lang="ts">
  import { cn } from '$lib/utils.js';
  import X from '@lucide/svelte/icons/x';
  import MapLibreGL, { type PopupOptions } from 'maplibre-gl';
  import { getContext } from 'svelte';
  import type { MarkerContext } from './MapMarker.svelte';

  interface Props {
    children?: import('svelte').Snippet;
    class?: string;
    open?: boolean;
    closeButton?: boolean;
    offset?: PopupOptions['offset'];
    anchor?: PopupOptions['anchor'];
    closeOnClick?: boolean;
    closeOnMove?: boolean;
    focusAfterOpen?: boolean;
    maxWidth?: string;
  }

  let {
    children,
    class: className,
    open = false,
    closeButton = false,
    offset = 16,
    anchor,
    closeOnClick,
    closeOnMove,
    focusAfterOpen,
    maxWidth,
  }: Props = $props();

  const markerCtx = getContext<MarkerContext>('marker');

  let popup: MapLibreGL.Popup | null = $state(null);
  let wrapperElement: HTMLDivElement | null = $state(null);
  let shouldStayOpen = $state(false);

  $effect(() => {
    const marker = markerCtx.getMarker();
    const ready = markerCtx.isReady();

    if (!ready || !marker || !wrapperElement) return;

    const container = document.createElement('div');

    const popupOptions: PopupOptions = {
      offset,
      closeButton: false,
      className: 'maplibre-popup-transparent',
    };

    if (anchor !== undefined) popupOptions.anchor = anchor;
    if (closeOnClick !== undefined) popupOptions.closeOnClick = closeOnClick;
    if (closeOnMove !== undefined) popupOptions.closeOnMove = closeOnMove;
    if (focusAfterOpen !== undefined) popupOptions.focusAfterOpen = focusAfterOpen;

    // Dragging the marker would otherwise close the popup.
    if (markerCtx.isDraggable?.()) {
      popupOptions.closeOnMove = false;
    }

    const popupInstance = new MapLibreGL.Popup(popupOptions).setDOMContent(container);

    if (maxWidth) {
      popupInstance.setMaxWidth(maxWidth);
    } else {
      popupInstance.setMaxWidth('none');
    }

    marker.setPopup(popupInstance);
    popup = popupInstance;

    // Remembers a popup that was open when the drag started, so it reopens when the drag ends.
    $effect(() => {
      const isDragging = markerCtx.isDragging?.();
      if (isDragging && popupInstance.isOpen()) {
        shouldStayOpen = true;
      }
    });

    $effect(() => {
      const isDragging = markerCtx.isDragging?.();
      if (!isDragging && shouldStayOpen && !popupInstance.isOpen()) {
        // MapLibre is still closing the popup at this point.
        setTimeout(() => {
          if (!popupInstance.isOpen()) {
            marker.togglePopup();
          }
          shouldStayOpen = false;
        }, 10);
      }
    });

    while (wrapperElement.firstChild) {
      container.appendChild(wrapperElement.firstChild);
    }

    return () => {
      while (container.firstChild) {
        wrapperElement?.appendChild(container.firstChild);
      }

      popupInstance.remove();
      popup = null;
    };
  });

  $effect(() => {
    const marker = markerCtx.getMarker();
    if (!popup || !marker) return;

    if (open !== popup.isOpen()) marker.togglePopup();
  });

  function handleClose() {
    popup?.remove();
  }
</script>

<div bind:this={wrapperElement} style="display: contents;">
  <div
    class={cn(
      'relative animate-in rounded-md border bg-popover p-3 text-popover-foreground shadow-sm fade-in-0 zoom-in-95',
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
