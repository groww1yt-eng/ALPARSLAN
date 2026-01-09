import { useEffect } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import ActiveJobs from "./pages/ActiveJobs";
import History from "./pages/History";
import Settings from "./pages/Settings";
import Compatibility from "./pages/Compatibility";
import NotFound from "./pages/NotFound";

// Initialize React Query client for data fetching
const queryClient = new QueryClient();

const App = () => {
  // Effect to handle API version mismatch events dispatched by apiClient
  useEffect(() => {
    const handleVersionMismatch = (event: any) => {
      const { expected, actual } = event.detail;
      toast.error("API Version Mismatch", {
        description: `Frontend expects ${expected} but Backend is ${actual}. Please refresh or update.`,
        duration: Infinity,
      });
    };

    window.addEventListener('api-version-mismatch', handleVersionMismatch);
    return () => window.removeEventListener('api-version-mismatch', handleVersionMismatch);
  }, []);

  return (
    // QueryClientProvider: Provides React Query context
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {/* Toasters for notifications */}
        <Toaster />
        <Sonner position="top-center" richColors />

        {/* Client-side Routing */}
        <BrowserRouter>
          <Routes>
            {/* Main Layout Wrapper */}
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/active" element={<ActiveJobs />} />
              <Route path="/history" element={<History />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/compatibility" element={<Compatibility />} />
            </Route>
            {/* Catch-all 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

