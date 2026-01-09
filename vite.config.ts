import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env variables
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.VITE_API_BASE_URL || 'http://localhost:3001';

  return {
    server: {
      host: "::", // Listen on all addresses
      port: 5173,
      // Proxy API requests to the backend server to avoid CORS issues
      proxy: {
        '/api': target,
        '/health': target,
      },
    },
    // Plugins: React support and Lovable tagger (dev only)
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"), // Path alias @ -> src
      },
    },
  };
});
