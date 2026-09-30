<script lang="ts">
  import { cn } from '$lib/utils.js';
  import MapLibreGL, { type PopupOptions } from 'maplibre-gl';
  import { getContext } from 'svelte';
  import type { MarkerContext } from './MapMarker.svelte';

  interface Props {
    children?: import('svelte').Snippet;
    class?: string;
    offset?: PopupOptions['offset'];
    anchor?: PopupOptions['anchor'];
  }

  let { children, class: className, offset = 16, anchor }: Props = $props();

  const markerCtx = getContext<MarkerContext>('marker');

  let wrapperElement: HTMLDivElement | null = $state(null);

  $effect(() => {
    const marker = markerCtx.getMarker();
    const markerElement = markerCtx.getElement();
    const map = markerCtx.getMap();
    const ready = markerCtx.isReady();

    if (!ready || !marker || !markerElement || !map || !wrapperElement) return;

    const container = document.createElement('div');

    const popupOptions: PopupOptions = {
      offset,
      closeOnClick: true,
      closeButton: false,
      className: 'maplibre-popup-transparent',
    };

    if (anchor !== undefined) popupOptions.anchor = anchor;

    const popupInstance = new MapLibreGL.Popup(popupOptions)
      .setMaxWidth('none')
      .setDOMContent(container);

    while (wrapperElement.firstChild) {
      container.appendChild(wrapperElement.firstChild);
    }

    const handleMouseEnter = () => {
      popupInstance.setLngLat(marker.getLngLat()).addTo(map);
    };

    const handleMouseLeave = () => {
      popupInstance.remove();
    };

    markerElement.addEventListener('mouseenter', handleMouseEnter);
    markerElement.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      markerElement.removeEventListener('mouseenter', handleMouseEnter);
      markerElement.removeEventListener('mouseleave', handleMouseLeave);

      while (container.firstChild) {
        wrapperElement?.appendChild(container.firstChild);
      }

      popupInstance.remove();
    };
  });
</script>

<div bind:this={wrapperElement} style="display: contents;">
  <div
    class={cn(
      'animate-in rounded-md bg-foreground px-2 py-1 text-xs text-background shadow-md fade-in-0 zoom-in-95',
      className,
    )}
  >
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
