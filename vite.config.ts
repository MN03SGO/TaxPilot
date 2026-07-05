import { defineConfig, loadEnv, type ProxyOptions } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

function createN8nProxy(webhookUrl?: string): Record<string, string | ProxyOptions> | undefined {
  if (!webhookUrl) return undefined;

  try {
    const parsedWebhookUrl = new URL(webhookUrl);
    const webhookPath = `${parsedWebhookUrl.pathname}${parsedWebhookUrl.search}`;

    return {
      '/api/n8n/webhook': {
        target: parsedWebhookUrl.origin,
        changeOrigin: true,
        secure: true,
        rewrite: () => webhookPath,
      },
    };
  } catch {
    return undefined;
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: createN8nProxy(env.VITE_N8N_WEBHOOK_URL),
    },
  };
});
