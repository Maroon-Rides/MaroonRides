<script lang="ts">
  import { browser } from '$app/environment';
  import { themeManager } from '$lib/managers/theme.manager.svelte';
  import { ModeWatcher } from 'mode-watcher';
  import { onDestroy, onMount } from 'svelte';

  onMount(() => {
    if (browser) {
      const root = document.documentElement;

      const updateTheme = async () => {
        themeManager.theme = root.classList.contains('dark') ? 'dark' : 'light';
      };

      updateTheme();

      const observer = new MutationObserver(updateTheme);
      observer.observe(root, {
        attributes: true,
        attributeFilter: ['class'],
      });

      onDestroy(() => observer.disconnect());
    }
  });
</script>

<ModeWatcher />
