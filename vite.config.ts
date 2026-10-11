import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

const LAYERS = ['app', 'pages', 'widgets', 'features', 'entities', 'shared'];

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    resolve: {
      alias: Object.fromEntries(
        LAYERS.map((layer) => [
          `@${layer}`,
          fileURLToPath(new URL(`./src/${layer}`, import.meta.url)),
        ]),
      ),
    },
    server: {
      // Адрес в браузере — localhost:5173 (redirect URI в Keycloak). Слушаем IPv4: иначе Node
      // выбирает ::1, а браузеры, идущие на 127.0.0.1, получают отказ в соединении
      host: '127.0.0.1',
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': {
          target: env.API_TARGET || 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
      },
    },
    preview: { host: '127.0.0.1', port: 5173, strictPort: true },
  };
});
