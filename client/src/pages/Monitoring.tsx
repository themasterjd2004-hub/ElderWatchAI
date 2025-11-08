import MonitoringFeed from "@/components/MonitoringFeed";
import VitalsPanel from "@/components/VitalsPanel";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, AlertTriangle } from "lucide-react";

export default function Monitoring() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Live Monitoring</h1>
          <p className="text-muted-foreground mt-1">
            Real-time AI-powered safety monitoring
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" data-testid="button-call-parent">
            <Phone className="h-4 w-4 mr-2" />
            Call Parent
          </Button>
          <Button variant="destructive" data-testid="button-emergency">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Emergency
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <MonitoringFeed />
          
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Current Location</h3>
                <p className="text-sm text-muted-foreground">
                  123 Oak Street, Springfield, IL 62701
                </p>
                <div className="flex gap-2 mt-3">
                  <Badge variant="outline">Home</Badge>
                  <Badge variant="outline">GPS: High Accuracy</Badge>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Live Vitals</h3>
            <VitalsPanel />
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-3">AI Detection Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Skeletal Tracking</span>
                <Badge className="bg-medical-stable text-white">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Fall Detection</span>
                <Badge className="bg-medical-stable text-white">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Audio Analysis</span>
                <Badge className="bg-medical-stable text-white">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Emotion Detection</span>
                <Badge className="bg-medical-stable text-white">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">rPPG Vitals</span>
                <Badge className="bg-medical-stable text-white">Active</Badge>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-primary/5 border-primary">
            <h4 className="font-semibold mb-2 text-sm">Privacy Protected</h4>
            <p className="text-xs text-muted-foreground">
              All monitoring uses skeletal tracking only. No raw video is stored. Data is encrypted and auto-deleted after 24 hours.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
