class ThemeManager {
  theme: 'light' | 'dark' = $state('light');
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
