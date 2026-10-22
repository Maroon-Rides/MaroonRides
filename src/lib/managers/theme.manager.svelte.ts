import type { Route } from '$lib/data/types';
import { mode } from 'mode-watcher';

export type Theme = 'light' | 'dark';

class ThemeManager {
  readonly theme: Theme = $derived(mode.current ?? 'light');

  tintFor(route: Route): string {
    return this.theme === 'light' ? route.lightColor : route.darkColor;
  }
}

// Persist themeManager across Svelte HMRs
let themeManager: ThemeManager;

if (import.meta.hot && import.meta.hot.data) {
  if (!import.meta.hot.data.themeManager) {
    import.meta.hot.data.themeManager = new ThemeManager();
  }
  themeManager = import.meta.hot.data.themeManager;
} else {
  themeManager = new ThemeManager();
}

export { themeManager };
