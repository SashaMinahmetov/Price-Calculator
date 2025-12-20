import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Cast process to any to avoid "Property 'cwd' does not exist on type 'Process'" error
  // which happens when @types/node is missing or conflicting with client-side types.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    // Ensure the server listens on all hosts (0.0.0.0) which is required for Docker/Railway
    server: {
      host: true,
    },
    preview: {
      host: true,
      allowedHosts: true, 
    },
    define: {
      // Vital: Replaces process.env.API_KEY with the string value during build
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
  };
});