import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Prospects from "./pages/Prospects";
import Analytics from "./pages/Analytics";
import Templates from "./pages/Templates";
import TemplateABTests from "./pages/TemplateABTests";
import TemplateAnalytics from "./pages/TemplateAnalytics";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/prospects" element={<Prospects />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/templates" element={<Templates />} />
      <Route path="/templates/ab-tests" element={<TemplateABTests />} />
      <Route path="/templates/analytics" element={<TemplateAnalytics />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </TooltipProvider>
);

export default App;
