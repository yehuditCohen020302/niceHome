import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  // Read PORT from the repo-root .env (shared with the server). Only used here, never exposed to the client.
  const env = loadEnv(mode, '..', '');
  const serverPort = Number(env.PORT || 3001);

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      proxy: {
        '/api': `http://127.0.0.1:${serverPort}`,
      },
    },
  };
});
