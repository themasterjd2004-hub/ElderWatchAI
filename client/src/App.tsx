import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import ThemeToggle from "@/components/ThemeToggle";
import EmergencyButton from "@/components/EmergencyButton";
import ProtectedRoute from "@/components/ProtectedRoute";
import Landing from "@/pages/Landing";
import SignIn from "@/pages/SignIn";
import SignUp from "@/pages/SignUp";
import Dashboard from "@/pages/Dashboard";
import Monitoring from "@/pages/Monitoring";
import LiveMonitoring from "@/pages/LiveMonitoring";
import History from "@/pages/History";
import Privacy from "@/pages/Privacy";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";
import { useState } from "react";
import EmergencyDispatchModal from "@/components/EmergencyDispatchModal";
import { useAuth } from "@/hooks/useAuth";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/signin">
        <SignIn />
      </Route>
      <Route path="/">
        {!isAuthenticated ? <SignIn /> : (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/monitoring">
        <ProtectedRoute>
          <Monitoring />
        </ProtectedRoute>
      </Route>
      <Route path="/live-monitoring">
        <ProtectedRoute>
          <LiveMonitoring />
        </ProtectedRoute>
      </Route>
      <Route path="/history">
        <ProtectedRoute>
          <History />
        </ProtectedRoute>
      </Route>
      <Route path="/privacy">
        <ProtectedRoute>
          <Privacy />
        </ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);

  const style = {
    "--sidebar-width": "16rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthWrapper 
          emergencyModalOpen={emergencyModalOpen}
          setEmergencyModalOpen={setEmergencyModalOpen}
          style={style}
        />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function AuthWrapper({ emergencyModalOpen, setEmergencyModalOpen, style }: {
  emergencyModalOpen: boolean;
  setEmergencyModalOpen: (open: boolean) => void;
  style: Record<string, string>;
}) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Router />;
  }

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b bg-background sticky top-0 z-10">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto">
            <Router />
          </main>
        </div>
      </div>
      <EmergencyButton onClick={() => setEmergencyModalOpen(true)} hasAlert={false} />
      <EmergencyDispatchModal
        open={emergencyModalOpen}
        onOpenChange={setEmergencyModalOpen}
      />
    </SidebarProvider>
  );
}
