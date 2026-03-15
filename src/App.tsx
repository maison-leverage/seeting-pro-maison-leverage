import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UndoableActionProvider } from "@/contexts/UndoableActionContext";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Prospects from "./pages/Prospects";
import Analytics from "./pages/Analytics";
import Templates from "./pages/Templates";
import TemplateAnalytics from "./pages/TemplateAnalytics";
import Formation from "./pages/Formation";
import DailyQueue from "./pages/DailyQueue";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <UndoableActionProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/daily" element={<DailyQueue />} />
            <Route path="/prospects" element={<Prospects />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/templates/analytics" element={<TemplateAnalytics />} />
            <Route path="/formation" element={<Formation />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </UndoableActionProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
