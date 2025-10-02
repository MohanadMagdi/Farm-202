import "./global.css";
import React, { useEffect } from "react";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { initializeDataSync } from "@/lib/data-sync";
import { expiryCountdownService } from "@/lib/expiry-countdown-service";
import { automaticWeaningService } from "@/lib/automatic-weaning-service";
import { DatabaseInitService } from "@/lib/database-init-service";
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
import WeightReportsPage from "./pages/WeightReportsPage";
import UsersPage from "./pages/UsersPage";
import BirthAnalyticsPage from "./pages/BirthAnalyticsPage";
import { InternalProductionDashboard } from "@/components/InternalProductionDashboard";
import WorkerDashboardPage from "./pages/WorkerDashboardPage";

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
const WeightReportsManagement = () => <WeightReportsPage />;
const UsersManagement = () => <UsersPage />;
const BirthAnalyticsManagement = () => <BirthAnalyticsPage />;
const InternalProductionManagement = () => <InternalProductionDashboard />;
const WorkerDashboard = () => <WorkerDashboardPage />;

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

// Worker-specific protected route that redirects workers to their dashboard
function WorkerProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log('WorkerProtectedRoute effect:', { 
      loading, 
      user: user?.role, 
      userEmail: user?.email,
      pathname: location.pathname 
    });
    
    if (!loading && user) {
      // Redirect farm workers to their specialized dashboard
      if (user.role === 'farm_worker' && location.pathname !== '/worker-dashboard') {
        console.log('Redirecting farm worker to dashboard');
        navigate('/worker-dashboard', { replace: true });
        return;
      }

      // Prevent non-workers from accessing worker dashboard
      if (user.role !== 'farm_worker' && location.pathname === '/worker-dashboard') {
        console.log('Redirecting non-worker away from dashboard');
        navigate('/', { replace: true });
        return;
      }
    }
  }, [user, loading, location.pathname, navigate]);

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

  // Show loading while redirecting
  if (user.role === 'farm_worker' && location.pathname !== '/worker-dashboard') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-farm-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التوجيه إلى لوحة العامل...</p>
        </div>
      </div>
    );
  }

  if (user.role !== 'farm_worker' && location.pathname === '/worker-dashboard') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-farm-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التوجيه...</p>
        </div>
      </div>
    );
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
          <WorkerProtectedRoute>
            <Layout>
              <Index />
            </Layout>
          </WorkerProtectedRoute>
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
        path="/animals/internal-production"
        element={
          <ProtectedRoute>
            <Layout>
              <InternalProductionManagement />
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
        path="/reports/weights"
        element={
          <ProtectedRoute>
            <Layout>
              <WeightReportsManagement />
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
      <Route
        path="/birth-analytics"
        element={
          <ProtectedRoute>
            <Layout>
              <BirthAnalyticsManagement />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/worker-dashboard"
        element={
          <WorkerProtectedRoute>
            <Layout>
              <WorkerDashboard />
            </Layout>
          </WorkerProtectedRoute>
        }
      />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => {
  useEffect(() => {
    // Set RTL direction for the entire document
    document.documentElement.setAttribute('dir', 'rtl');
    document.documentElement.setAttribute('lang', 'ar');
    document.body.classList.add('rtl');

    // Initialize data synchronization
    initializeDataSync();

    // Initialize warehouse items if needed
    DatabaseInitService.autoInitialize().catch(error => 
      console.error('Failed to initialize warehouse:', error)
    );

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

    // Initialize automatic transfer scheduler
    import("./lib/data-service").then(({ automaticTransferScheduler }) => {
      automaticTransferScheduler.startPeriodicCheck();
      console.log("Automatic transfer scheduler initialized");
    }).catch(error => {
      console.error("Error initializing automatic transfer scheduler:", error);
    });

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

export default App;

// Initialize React app with HMR support
function initializeApp() {
  const container = document.getElementById("root")!;

  // Prevent "createRoot() on a container that has already been passed to createRoot()" warning
  // This can happen during development when HMR (Hot Module Replacement) re-executes this code
  let root = (window as any).__reactRoot;

  if (!root) {
    // Double-check to prevent race conditions during HMR
    if (!(container as any)._reactRootContainer) {
      root = createRoot(container);
      (window as any).__reactRoot = root;
      (container as any)._reactRootContainer = true;
    }
  }

  if (root) {
    root.render(<App />);
  }
}

// Initialize the app
initializeApp();

// HMR support for development
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    initializeApp();
  });
}
