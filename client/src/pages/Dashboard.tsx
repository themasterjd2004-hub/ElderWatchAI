import ParentStatusCard from "@/components/ParentStatusCard";
import VitalsPanel from "@/components/VitalsPanel";
import AlertCard from "@/components/AlertCard";
import IncidentTimeline from "@/components/IncidentTimeline";
import { Card } from "@/components/ui/card";
import { Activity, Shield, Clock, AlertTriangle } from "lucide-react";
import { useState } from "react";

export default function Dashboard() {
  const [hasActiveAlert] = useState(true);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Monitor your parent's safety in real-time
        </p>
      </div>

      {hasActiveAlert && (
        <AlertCard />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ParentStatusCard />
        </div>
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Quick Stats</h3>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Monitoring Status
              </p>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-medical-stable animate-pulse" />
                <p className="text-sm font-medium">Active - 24/7</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Incidents This Week
              </p>
              <p className="text-2xl font-bold">3</p>
              <p className="text-xs text-muted-foreground">2 resolved, 1 false alarm</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Avg Response Time
              </p>
              <p className="text-2xl font-bold font-mono">2m 29s</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Live Vitals</h2>
            <p className="text-sm text-muted-foreground">Current health metrics</p>
          </div>
          <VitalsPanel />
        </div>
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-4 w-4 text-primary" />
              <h4 className="font-medium text-sm">Privacy Status</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Encryption</span>
                <span className="text-medical-stable font-medium">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Mode</span>
                <span className="font-medium">Skeletal</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Auto-delete</span>
                <span className="font-medium">24h</span>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-primary" />
              <h4 className="font-medium text-sm">Next Data Cleanup</h4>
            </div>
            <p className="text-2xl font-mono font-bold">18h 42m</p>
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: "25%" }} />
            </div>
          </Card>
        </div>
      </div>

      <div>
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Recent Incidents</h2>
          <p className="text-sm text-muted-foreground">
            Last 7 days of monitoring activity
          </p>
        </div>
        <IncidentTimeline />
      </div>
    </div>
  );
}
