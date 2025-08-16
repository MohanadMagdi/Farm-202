import "./global.css";
import { useEffect } from "react";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { initializeDataSync } from "@/lib/data-sync";
import { expiryCountdownService } from "@/lib/expiry-countdown-service";
import { automaticWeaningService } from "@/lib/automatic-weaning-service";
import Layout from "@/components/Layout";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage";
import PlaceholderPage from "@/components/PlaceholderPage";
import AnimalsPage from "./pages/AnimalsPage";
import AnimalsOverviewPage from "./pages/AnimalsOverviewPage";
import BarnsPage from "./pages/BarnsPage";
import InventoryPage from "./pages/InventoryPage";
import FeedingPage from "./pages/FeedingPage";
import ReportsPage from "./pages/ReportsPage";
import UsersPage from "./pages/UsersPage";

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
const UsersManagement = () => <UsersPage />;

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-farm-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل النظام...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Index />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/animals"
        element={
          <ProtectedRoute>
            <Layout>
              <AllAnimalsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/animals/males"
        element={
          <ProtectedRoute>
            <Layout>
              <MalesPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/animals/females"
        element={
          <ProtectedRoute>
            <Layout>
              <FemalesPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/animals/newborns"
        element={
          <ProtectedRoute>
            <Layout>
              <NewbornsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/barns"
        element={
          <ProtectedRoute>
            <Layout>
              <BarnsManagement />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/inventory"
        element={
          <ProtectedRoute>
            <Layout>
              <InventoryManagement />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/feeding"
        element={
          <ProtectedRoute>
            <Layout>
              <FeedingManagement />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Layout>
              <ReportsManagement />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <Layout>
              <UsersManagement />
            </Layout>
          </ProtectedRoute>
        }
      />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => {
  useEffect(() => {
    // Initialize data synchronization
    initializeDataSync();

    // Initialize expiry countdown service
    if (!expiryCountdownService.isServiceRunning()) {
      expiryCountdownService.start();
      console.log("Expiry countdown service initialized");
    }

    // Initialize automatic weaning service
    if (!automaticWeaningService.isServiceRunning()) {
      automaticWeaningService.start();
      console.log("Automatic weaning service initialized");
    }

    // Suppress ResizeObserver loop error
    const handleResizeObserverError = (e: ErrorEvent) => {
      if (
        e.message &&
        e.message.includes(
          "ResizeObserver loop completed with undelivered notifications",
        )
      ) {
        e.stopImmediatePropagation();
        e.preventDefault();
        return false;
      }
    };

    const handleUnhandledRejection = (e: PromiseRejectionEvent) => {
      if (
        e.reason &&
        e.reason.message &&
        e.reason.message.includes("ResizeObserver")
      ) {
        e.preventDefault();
        return false;
      }
    };

    // Override console.error and console.warn to filter ResizeObserver warnings
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    console.error = (...args: any[]) => {
      const message = args[0];
      if (
        typeof message === "string" &&
        message.includes("ResizeObserver loop completed")
      ) {
        return; // Suppress this specific error
      }
      originalConsoleError.apply(console, args);
    };

    console.warn = (...args: any[]) => {
      const message = args[0];
      if (
        typeof message === "string" &&
        message.includes("ResizeObserver loop completed")
      ) {
        return; // Suppress this specific warning
      }
      originalConsoleWarn.apply(console, args);
    };

    window.addEventListener("error", handleResizeObserverError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleResizeObserverError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
      console.error = originalConsoleError; // Restore original console.error
      console.warn = originalConsoleWarn; // Restore original console.warn
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

createRoot(document.getElementById("root")!).render(<App />);
