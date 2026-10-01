import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { version } from './package.json';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  define: { __APP_VERSION__: JSON.stringify(version) },
  // Pre-bundling splits the Stencil runtime so the lazy component can load a second copy of it.
  optimizeDeps: { exclude: ['jeep-sqlite', 'jeep-sqlite/loader'] },
});
