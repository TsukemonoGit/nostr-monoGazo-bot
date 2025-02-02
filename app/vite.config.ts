import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig(({ command }) => ({
  plugins: [solidPlugin()],
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
    outDir: './docs',
  },
  base: command === "serve" ? "/" : "/nostr-monoGazo-bot/",
}));
