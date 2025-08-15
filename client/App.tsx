import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import PlaceholderPage from "@/components/PlaceholderPage";
import AnimalsPage from "./pages/AnimalsPage";
import AnimalsOverviewPage from "./pages/AnimalsOverviewPage";
import BarnsPage from "./pages/BarnsPage";
import InventoryPage from "./pages/InventoryPage";
import FeedingPage from "./pages/FeedingPage";
import ReportsPage from "./pages/ReportsPage";

const queryClient = new QueryClient();

// Animal page components
const AllAnimalsPage = () => <AnimalsOverviewPage />;

const MalesPage = () => <AnimalsPage animalType="male" />;
const FemalesPage = () => <AnimalsPage animalType="female" />;
const NewbornsPage = () => <AnimalsPage animalType="newborn" />;

const BarnsManagement = () => <BarnsPage />;

const InventoryManagement = () => <InventoryPage />;

const FeedingManagement = () => <FeedingPage />;

const ReportsManagement = () => <ReportsPage />;

const UsersPage = () => (
  <PlaceholderPage 
    title="إدارة المستخدمين" 
    description="إدارة مستخدمي النظام والصلاحيات"
  />
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/animals" element={<AllAnimalsPage />} />
            <Route path="/animals/males" element={<MalesPage />} />
            <Route path="/animals/females" element={<FemalesPage />} />
            <Route path="/animals/newborns" element={<NewbornsPage />} />
            <Route path="/barns" element={<BarnsManagement />} />
            <Route path="/inventory" element={<InventoryManagement />} />
            <Route path="/feeding" element={<FeedingManagement />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/users" element={<UsersPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
