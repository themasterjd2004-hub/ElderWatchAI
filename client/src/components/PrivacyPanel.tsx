import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Lock, Shield, Clock, Database } from "lucide-react";
import { useState } from "react";

export default function PrivacyPanel() {
  const [localOnly, setLocalOnly] = useState(true);
  const [autoDelete, setAutoDelete] = useState(true);
  const [hospitalApi, setHospitalApi] = useState(true);
  const [skeletalMode, setSkeletalMode] = useState(true);

  return (
    <div className="space-y-4" data-testid="container-privacy-panel">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Encryption Status</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-medical-stable" />
              <span className="text-sm">AES-256 Encryption</span>
            </div>
            <Badge className="bg-medical-stable text-white">Active</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-medical-stable" />
              <span className="text-sm">End-to-End Protected</span>
            </div>
            <Badge className="bg-medical-stable text-white">Active</Badge>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Data Retention</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Auto-delete data</p>
              <p className="text-xs text-muted-foreground">
                Automatically delete recordings after 24 hours
              </p>
            </div>
            <Switch
              checked={autoDelete}
              onCheckedChange={setAutoDelete}
              data-testid="switch-auto-delete"
            />
          </div>
          {autoDelete && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">Next cleanup in 18h 42m</p>
              <div className="w-full bg-background rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: "25%" }} />
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Database className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Privacy Options</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Local-only processing</p>
              <p className="text-xs text-muted-foreground">
                Process AI data on device only
              </p>
            </div>
            <Switch
              checked={localOnly}
              onCheckedChange={setLocalOnly}
              data-testid="switch-local-only"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Skeletal mode</p>
              <p className="text-xs text-muted-foreground">
                Only capture skeletal data, no video
              </p>
            </div>
            <Switch
              checked={skeletalMode}
              onCheckedChange={setSkeletalMode}
              data-testid="switch-skeletal-mode"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Hospital API access</p>
              <p className="text-xs text-muted-foreground">
                Allow hospitals to receive emergency data
              </p>
            </div>
            <Switch
              checked={hospitalApi}
              onCheckedChange={setHospitalApi}
              data-testid="switch-hospital-api"
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
