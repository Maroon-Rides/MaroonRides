<script lang="ts">
  import { beforeNavigate, goto } from '$app/navigation';
  import * as Card from '$lib/components/ui/card';
  import { cn, type WithElementRef } from '$lib/utils.js';
  import { clamp, last, minBy, range, throttle } from 'lodash-es';
  import { onMount, setContext, tick } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { fly } from 'svelte/transition';

  interface SnapPoint {
    height: number;
    id?: string;
  }

  type Props = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
    snapPoints?: SnapPoint[];
    initialSnapIndex?: number;
    dragThreshold?: number;
    animationDuration?: number;
    enableTransitions?: boolean;
    onSnapChange?: (index: number, snapPoint: SnapPoint) => void;
    header?: any;
  };

  let {
    ref = $bindable(null),
    class: className,
    children,
    header,
    snapPoints = [
      { height: 20, id: 's' },
      { height: 40, id: 'm' },
      { height: 80, id: 'l' },
    ],
    initialSnapIndex = 0,
    dragThreshold = 20,
    animationDuration = 500,
    enableTransitions = true,
    onSnapChange,
    ...restProps
  }: Props = $props();

  let containerRef: HTMLDivElement | null = $state(null);
  let contentRef: HTMLDivElement | null = $state(null);
  let contentInnerRef: HTMLDivElement | null = $state(null);
  let isDragging = $state(false);
  let currentSnapIndex = $state(0);
  let currentHeight = $state(0);
  let viewportHeight = $state(typeof window !== 'undefined' ? window.innerHeight : 0);
  let safeAreaBottom = $state(0);

  // Skips the transition on first render.
  let initialLayoutSet = $state(false);

  // Pixels scrolled into the content. 0 is the top.
  let scrollOffset = $state(0);

  // Reading layout mid-gesture forces a reflow on every frame.
  let cachedMaxScroll = 0;
  let cachedContentHeight = 0;
  let cachedContainerHeight = 0;

  // Stays true until the exit animation finishes.
  let visible = $state(true);

  // Layout updates wait until the snap transition ends.
  let isSnapping = $state(false);

  type GestureMode = 'none' | 'sheet-drag' | 'content-scroll';
  let gestureMode: GestureMode = 'none';
  let touchStartY = 0;
  let touchCurrentY = 0;
  let touchStartHeight = 0;
  let touchStartScrollOffset = 0;
  let fromHandle = false;

  let velocitySamples: { y: number; t: number }[] = [];
  const VELOCITY_WINDOW = 80; // ms

  let animationFrameId: number | null = null;

  const DECELERATION = 0.95; // per frame at 60fps. Closer to 1 coasts longer.
  const MIN_VELOCITY = 0.1; // px per frame
  const RUBBER_BAND_FACTOR = 0.55; // share of the drag that moves the content past its edge
  const BOUNCE_SPRING = 0.06;
  const BOUNCE_DAMPING = 0.65;

  const getHeightPx = (pct: number) => (viewportHeight * pct) / 100;
  const getSnapHeightPx = (i: number) => getHeightPx(snapPoints[i].height);
  const maxSnapHeightPx = $derived(getSnapHeightPx(snapPoints.length - 1));
  const minSnapHeightPx = $derived(getSnapHeightPx(0));
  const sheetHeightPx = $derived(maxSnapHeightPx + safeAreaBottom);
  const sheetTranslateY = $derived(Math.max(0, maxSnapHeightPx - currentHeight));
  const isAtMaxSnap = () => Math.abs(currentHeight - maxSnapHeightPx) < 1;

  /** Max scrollable distance (0 if content doesn't overflow) */
  const maxScrollOffset = () => {
    if (!contentRef || !contentInnerRef) return cachedMaxScroll;
    // Cached during a drag to avoid a reflow per frame.
    if (isDragging || gestureMode !== 'none') {
      return cachedMaxScroll;
    }
    const overflow = contentInnerRef.scrollHeight - contentRef.clientHeight;
    return Math.max(0, overflow);
  };

  /** Update cached layout measurements (call during non-critical times) */
  const updateLayoutCache = () => {
    if (!contentRef || !contentInnerRef) return;
    cachedContentHeight = contentInnerRef.scrollHeight;
    cachedContainerHeight = contentRef.clientHeight;
    cachedMaxScroll = Math.max(0, cachedContentHeight - cachedContainerHeight);
  };

  const hasScrollableContent = () => maxScrollOffset() > 0;

  const updateViewportHeight = () => {
    viewportHeight = window.innerHeight;
    const probe = document.createElement('div');
    probe.style.cssText =
      'position:fixed;bottom:0;height:env(safe-area-inset-bottom,0px);pointer-events:none;visibility:hidden';
    document.body.appendChild(probe);
    safeAreaBottom = probe.offsetHeight;
    document.body.removeChild(probe);
    currentHeight = getSnapHeightPx(currentSnapIndex);
  };

  const recordVelocity = (y: number) => {
    const now = performance.now();
    velocitySamples.push({ y, t: now });
    const cutoff = now - VELOCITY_WINDOW;
    while (velocitySamples.length > 0 && velocitySamples[0].t < cutoff) {
      velocitySamples.shift();
    }
  };

  /** Returns velocity in px/ms. Positive = finger moving up (scroll down / expand). */
  const computeVelocity = (): number => {
    if (velocitySamples.length < 2) return 0;
    const first = velocitySamples[0];
    const latest = last(velocitySamples)!;
    const dt = latest.t - first.t;
    if (dt < 1) return 0;
    return (first.y - latest.y) / dt; // positive = up
  };

  const findNearestSnap = (height: number, velocity: number): number => {
    if (Math.abs(velocity) > 0.4) {
      const dir = velocity > 0 ? 1 : -1;
      const target = currentSnapIndex + dir;
      if (target >= 0 && target < snapPoints.length) return target;
    }
    return minBy(range(snapPoints.length), (i) => Math.abs(height - getSnapHeightPx(i)))!;
  };

  const snapTo = async (index: number) => {
    if (index < 0 || index >= snapPoints.length) return;
    const prev = currentSnapIndex;
    isSnapping = true;
    currentSnapIndex = index;
    currentHeight = getSnapHeightPx(index);
    if (index !== snapPoints.length - 1) {
      scrollOffset = 0;
    }

    if (prev !== index && onSnapChange) {
      onSnapChange(index, snapPoints[index]);
    }

    await tick();

    // Measured after the transition, since layout is still moving during it.
    setTimeout(() => {
      isSnapping = false;
      updateLayoutCache();
    }, 320);
  };

  export type BottomSheetContext = {
    snapTo: (index: number) => void;
    collapse: () => void;
  };

  setContext<BottomSheetContext>('bottom-sheet', {
    snapTo,
    collapse: () => snapTo(initialSnapIndex),
  });

  const stopAnimation = () => {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  };

  const startScrollInertia = (velocityPxMs: number) => {
    stopAnimation();
    // px/ms to px per frame at 60fps
    let v = velocityPxMs * (1000 / 60);
    if (Math.abs(v) < MIN_VELOCITY) return;

    const maxScroll = maxScrollOffset();

    const step = () => {
      scrollOffset += v;

      if (scrollOffset < 0) {
        v *= BOUNCE_DAMPING;
        scrollOffset += -scrollOffset * BOUNCE_SPRING * 3;
        if (Math.abs(scrollOffset) < 0.5 && Math.abs(v) < MIN_VELOCITY) {
          scrollOffset = 0;
          animationFrameId = null;
          return;
        }
      } else if (scrollOffset > maxScroll) {
        v *= BOUNCE_DAMPING;
        scrollOffset -= (scrollOffset - maxScroll) * BOUNCE_SPRING * 3;
        if (Math.abs(scrollOffset - maxScroll) < 0.5 && Math.abs(v) < MIN_VELOCITY) {
          scrollOffset = maxScroll;
          animationFrameId = null;
          return;
        }
      } else {
        v *= DECELERATION;
      }

      if (Math.abs(v) < MIN_VELOCITY && scrollOffset >= 0 && scrollOffset <= maxScroll) {
        scrollOffset = clamp(scrollOffset, 0, maxScroll);
        animationFrameId = null;
        return;
      }

      animationFrameId = requestAnimationFrame(step);
    };

    animationFrameId = requestAnimationFrame(step);
  };

  const startBounceBack = () => {
    stopAnimation();
    const maxScroll = maxScrollOffset();
    let v = 0;

    const step = () => {
      let target: number;
      if (scrollOffset < 0) {
        target = 0;
      } else if (scrollOffset > maxScroll) {
        target = maxScroll;
      } else {
        animationFrameId = null;
        return;
      }

      const dist = target - scrollOffset;
      v = (v + dist * BOUNCE_SPRING) * BOUNCE_DAMPING;
      scrollOffset += v;

      if (Math.abs(dist) < 0.5 && Math.abs(v) < 0.1) {
        scrollOffset = target;
        animationFrameId = null;
        return;
      }

      animationFrameId = requestAnimationFrame(step);
    };

    animationFrameId = requestAnimationFrame(step);
  };

  const onTouchStart = (e: TouchEvent, isHandle: boolean) => {
    stopAnimation();
    updateLayoutCache();

    const y = e.touches[0].clientY;
    touchStartY = y;
    touchCurrentY = y;
    touchStartHeight = currentHeight;
    touchStartScrollOffset = scrollOffset;
    fromHandle = isHandle;
    velocitySamples = [];
    recordVelocity(y);

    if (isHandle) {
      gestureMode = 'sheet-drag';
      isDragging = true;
    } else if (isAtMaxSnap() && hasScrollableContent()) {
      gestureMode = 'content-scroll';
      isDragging = false;
    } else {
      gestureMode = 'sheet-drag';
      isDragging = true;
    }
  };

  const onTouchMove = (e: TouchEvent) => {
    if (gestureMode === 'none') return;
    e.preventDefault();

    const y = e.touches[0].clientY;
    touchCurrentY = y;
    recordVelocity(y);

    const totalDeltaY = touchStartY - y; // positive = finger moved up

    if (gestureMode === 'content-scroll') {
      let newOffset = touchStartScrollOffset + totalDeltaY;

      const maxScroll = maxScrollOffset();

      if (newOffset < 0) {
        newOffset = newOffset * RUBBER_BAND_FACTOR;
      } else if (newOffset > maxScroll) {
        const excess = newOffset - maxScroll;
        newOffset = maxScroll + excess * RUBBER_BAND_FACTOR;
      }

      // Pulling down far enough at the top hands the gesture to the sheet, which collapses it.
      if (scrollOffset <= 0 && totalDeltaY < -5 && touchStartScrollOffset === 0) {
        gestureMode = 'sheet-drag';
        isDragging = true;
        touchStartY = y;
        touchStartHeight = maxSnapHeightPx;
        scrollOffset = 0;
        return;
      }

      scrollOffset = newOffset;
      return;
    }

    if (gestureMode === 'sheet-drag') {
      const dragDelta = touchStartY - y;
      let newHeight = touchStartHeight + dragDelta;

      const maxH = maxSnapHeightPx;
      const minH = minSnapHeightPx;

      // Dragging up past the top snap point scrolls the content instead.
      if (newHeight >= maxH && hasScrollableContent() && dragDelta > 0 && !fromHandle) {
        currentHeight = maxH;
        if (currentSnapIndex !== snapPoints.length - 1) {
          currentSnapIndex = snapPoints.length - 1;
        }
        gestureMode = 'content-scroll';
        isDragging = false;
        touchStartY = y;
        touchStartScrollOffset = 0;
        scrollOffset = 0;
        return;
      }

      if (newHeight < minH) {
        newHeight = minH - (minH - newHeight) * 0.3;
      } else if (newHeight > maxH) {
        newHeight = maxH + (newHeight - maxH) * 0.3;
      }

      currentHeight = newHeight;
    }
  };

  const onTouchEnd = (e: TouchEvent) => {
    if (gestureMode === 'none') return;

    const y = e.changedTouches[0].clientY;
    recordVelocity(y);
    const velocity = computeVelocity();

    if (gestureMode === 'sheet-drag') {
      isDragging = false;
      const nearestIndex = findNearestSnap(currentHeight, velocity);
      snapTo(nearestIndex);
    } else if (gestureMode === 'content-scroll') {
      isDragging = false;
      const maxScroll = maxScrollOffset();

      if (scrollOffset < 0 || scrollOffset > maxScroll) {
        startBounceBack();
      } else {
        startScrollInertia(velocity);
      }
    }

    gestureMode = 'none';
  };

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();

    if (isAtMaxSnap() && hasScrollableContent()) {
      scrollOffset = clamp(scrollOffset + e.deltaY, 0, maxScrollOffset());
      // Scrolling up at the top collapses the sheet.
      if (scrollOffset <= 0 && e.deltaY < 0) {
        snapTo(currentSnapIndex - 1);
      }
      return;
    }

    const lastSnapIndex = snapPoints.length - 1;

    if (e.deltaY > 0) {
      const nextIndex = clamp(currentSnapIndex + 1, 0, lastSnapIndex);
      if (nextIndex !== currentSnapIndex) snapTo(nextIndex);
    } else if (e.deltaY < 0) {
      const prevIndex = clamp(currentSnapIndex - 1, 0, lastSnapIndex);
      if (prevIndex !== currentSnapIndex) snapTo(prevIndex);
    }
  };

  const onHandleMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    stopAnimation();
    updateLayoutCache();
    touchStartY = e.clientY;
    touchCurrentY = e.clientY;
    touchStartHeight = currentHeight;
    fromHandle = true;
    gestureMode = 'sheet-drag';
    isDragging = true;
    velocitySamples = [];
  };

  const onGlobalMouseMove = (e: MouseEvent) => {
    if (gestureMode !== 'sheet-drag' || !isDragging) return;

    const y = e.clientY;
    recordVelocity(y);
    let newHeight = touchStartHeight + (touchStartY - y);

    const maxH = maxSnapHeightPx;
    const minH = minSnapHeightPx;

    if (newHeight < minH) {
      newHeight = minH - (minH - newHeight) * 0.3;
    } else if (newHeight > maxH) {
      newHeight = maxH + (newHeight - maxH) * 0.3;
    }

    currentHeight = newHeight;
  };

  const onGlobalMouseUp = (e: MouseEvent) => {
    if (!isDragging) return;
    isDragging = false;

    recordVelocity(e.clientY);
    const velocity = computeVelocity();
    const nearestIndex = findNearestSnap(currentHeight, velocity);
    snapTo(nearestIndex);
    gestureMode = 'none';
  };

  // Non-passive, since every handler calls preventDefault.

  let handleTouchBound: HTMLDivElement | null = null;
  let contentTouchBound: HTMLDivElement | null = null;

  const bindHandleListeners = (node: HTMLDivElement | null) => {
    if (handleTouchBound) {
      handleTouchBound.removeEventListener('touchstart', handleHandleTouchStart as any);
      handleTouchBound.removeEventListener('touchmove', handleHandleTouchMove as any);
      handleTouchBound.removeEventListener('touchend', handleHandleTouchEnd as any);
      handleTouchBound = null;
    }
    if (node) {
      node.addEventListener('touchstart', handleHandleTouchStart as any, { passive: false });
      node.addEventListener('touchmove', handleHandleTouchMove as any, { passive: false });
      node.addEventListener('touchend', handleHandleTouchEnd as any, { passive: false });
      handleTouchBound = node;
    }
  };

  const bindContentListeners = (node: HTMLDivElement | null) => {
    if (contentTouchBound) {
      contentTouchBound.removeEventListener('touchstart', handleContentTouchStart as any);
      contentTouchBound.removeEventListener('touchmove', handleContentTouchMove as any);
      contentTouchBound.removeEventListener('touchend', handleContentTouchEnd as any);
      contentTouchBound = null;
    }
    if (node) {
      node.addEventListener('touchstart', handleContentTouchStart as any, { passive: false });
      node.addEventListener('touchmove', handleContentTouchMove as any, { passive: false });
      node.addEventListener('touchend', handleContentTouchEnd as any, { passive: false });
      contentTouchBound = node;
    }
  };

  function handleHandleTouchStart(e: TouchEvent) {
    onTouchStart(e, true);
  }
  function handleHandleTouchMove(e: TouchEvent) {
    onTouchMove(e);
  }
  function handleHandleTouchEnd(e: TouchEvent) {
    onTouchEnd(e);
  }
  function handleContentTouchStart(e: TouchEvent) {
    onTouchStart(e, false);
  }
  function handleContentTouchMove(e: TouchEvent) {
    onTouchMove(e);
  }
  function handleContentTouchEnd(e: TouchEvent) {
    onTouchEnd(e);
  }

  let handleRef: HTMLDivElement | null = $state(null);

  $effect(() => {
    bindHandleListeners(handleRef);
  });
  $effect(() => {
    bindContentListeners(contentRef);
  });

  // The sheet animates closed before the page changes.
  let isClosing = false;
  beforeNavigate((navigation) => {
    if (!isClosing && visible) {
      const targetUrl = navigation.to?.url.pathname;
      if (targetUrl && targetUrl !== navigation.from?.url.pathname) {
        navigation.cancel();
        isClosing = true;
        visible = false;
        setTimeout(() => {
          goto(targetUrl);
        }, animationDuration * 0.25);
      }
    }
  });

  onMount(() => {
    updateViewportHeight();
    currentSnapIndex = initialSnapIndex;
    currentHeight = getSnapHeightPx(currentSnapIndex);
    requestAnimationFrame(() => {
      updateLayoutCache();
      requestAnimationFrame(() => {
        initialLayoutSet = true;
      });
    });

    let resizeObserver: ResizeObserver | null = null;
    if (contentInnerRef) {
      resizeObserver = new ResizeObserver(() => {
        if (!isDragging && !isSnapping && gestureMode === 'none') {
          updateLayoutCache();
        }
      });
      resizeObserver.observe(contentInnerRef);
    }

    const onResize = throttle(updateViewportHeight, 100);

    window.addEventListener('mousemove', onGlobalMouseMove);
    window.addEventListener('mouseup', onGlobalMouseUp);
    window.addEventListener('resize', onResize);

    return () => {
      stopAnimation();
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener('mousemove', onGlobalMouseMove);
      window.removeEventListener('mouseup', onGlobalMouseUp);
      window.removeEventListener('resize', onResize);
      onResize.cancel();
      bindHandleListeners(null);
      bindContentListeners(null);
    };
  });
</script>

<svelte:window />

{#snippet sheetContent()}
  <div
    class="flex w-full flex-col"
    style:height="{sheetHeightPx}px"
    style:transform="translate3d(0, {sheetTranslateY}px, 0)"
    style:contain="layout style"
    style:will-change="transform"
    style:transition={isDragging
      ? 'none'
      : `transform ${animationDuration}ms cubic-bezier(0.2, 0, 0, 1)`}
  >
    <Card.Root
      bind:ref
      class="pointer-events-auto flex h-full flex-col overflow-hidden rounded-b-none pt-2 pb-0"
    >
      <div
        bind:this={handleRef}
        class="shrink-0 cursor-grab active:cursor-grabbing"
        role="button"
        tabindex="0"
        aria-label="Drag to resize"
        onmousedown={onHandleMouseDown}
      >
        <div class="mb-2 flex w-full items-center justify-center">
          <div class="h-1 w-[8%] rounded-full bg-muted-foreground/20"></div>
        </div>

        {@render header?.()}
      </div>

      <!-- Scrolls with translateY instead of native overflow -->
      <div
        bind:this={contentRef}
        class="relative flex-1 touch-none overflow-hidden"
        style="contain: layout;"
        role="region"
        tabindex="-1"
        aria-label="Sheet content"
        onwheel={handleWheel}
      >
        <div
          bind:this={contentInnerRef}
          style:transform="translate3d(0, {-scrollOffset}px, 0)"
          style:backface-visibility="hidden"
          style:will-change="transform"
          style:min-height="100%"
          style:padding-bottom="{safeAreaBottom}px"
        >
          {@render children?.()}
        </div>
      </div>
    </Card.Root>
  </div>
{/snippet}

{#if visible}
  <div
    bind:this={containerRef}
    class={cn('pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col', className)}
    in:fly={{ y: 200, duration: enableTransitions ? animationDuration : 0, opacity: 1 }}
    out:fly|global={{ y: currentHeight + safeAreaBottom, duration: animationDuration, opacity: 1 }}
    {...restProps}
  >
    {@render sheetContent()}
  </div>
{/if}
