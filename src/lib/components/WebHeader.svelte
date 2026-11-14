<script lang="ts">
  import logo from '$lib/assets/logo.png';
  import Button from '$lib/components/ui/button/button.svelte';
  import { detectStorePlatform, storeUrl } from '$lib/utils/app-store';
  import { Download } from '@lucide/svelte';

  const storePlatform = detectStorePlatform(navigator.userAgent, navigator.maxTouchPoints);
</script>

<header
  class="fixed inset-x-0 top-0 z-20 flex h-14 items-center justify-between border-b bg-background px-4 dark:bg-card"
>
  <div class="flex items-center gap-2">
    <img src={logo} alt="" class="size-8 rounded-lg" />
    <span class="text-lg font-semibold">Maroon Rides</span>
  </div>

  {#if storePlatform}
    <Button href={storeUrl(storePlatform)} class="rounded-full" size="sm">
      <Download />
      Get the App
    </Button>
  {/if}
</header>
