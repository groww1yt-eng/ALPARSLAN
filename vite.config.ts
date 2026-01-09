import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
// Main Vite configuration entry
export default defineConfig(({ mode }) => {
  // Load environment variables based on the current mode (development, production)
  // process.cwd() is the root directory of the project
  const env = loadEnv(mode, process.cwd(), '');

  // Define variables for API proxy target
  // Default to localhost:3001 if VITE_API_BASE_URL is not set
  const target = env.VITE_API_BASE_URL || 'http://localhost:3001';

  return {
    server: {
      // Listen on all network addresses (0.0.0.0/::)
      host: "::",
      port: 5173,
      // Proxy configuration to route /api requests to the backend server
      // This resolves Cross-Origin Resource Sharing (CORS) issues during development
      proxy: {
        '/api': target,
        '/health': target,
      },
    },
    // Plugins used by Vite
    // - react(): Enables Fast Refresh and SWC compiler for React
    // - componentTagger(): Tool for visual editing/tagging in Lovable (dev mode only)
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),

    // Module resolution aliases
    resolve: {
      alias: {
        // Map "@" to the "src" directory for cleaner imports (e.g., "@/components/Button")
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
