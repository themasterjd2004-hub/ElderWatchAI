import PrivacyPanel from "@/components/PrivacyPanel";
import { Card } from "@/components/ui/card";
import { Shield, Lock, Eye, Database } from "lucide-react";

export default function Privacy() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Privacy & Security</h1>
        <p className="text-muted-foreground mt-1">
          Manage data protection and privacy settings
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-medical-stable/10 rounded-lg">
              <Lock className="h-5 w-5 text-medical-stable" />
            </div>
            <h3 className="font-semibold text-sm">Encryption</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            AES-256 end-to-end encryption protecting all data
          </p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-medical-monitoring/10 rounded-lg">
              <Eye className="h-5 w-5 text-medical-monitoring" />
            </div>
            <h3 className="font-semibold text-sm">Skeletal Mode</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Privacy-first AI using pose estimation only
          </p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold text-sm">Auto-Delete</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            All recordings deleted within 24 hours
          </p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-medical-stable/10 rounded-lg">
              <Shield className="h-5 w-5 text-medical-stable" />
            </div>
            <h3 className="font-semibold text-sm">HIPAA Inspired</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Medical-grade security practices
          </p>
        </Card>
      </div>

      <PrivacyPanel />

      <Card className="p-6 bg-muted/50">
        <h3 className="font-semibold mb-3">How Your Data is Protected</h3>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">On-Device AI Processing:</strong> All AI analysis happens locally on the monitoring device. Only skeletal pose data and vital statistics are transmitted, never raw video footage.
          </p>
          <p>
            <strong className="text-foreground">Encrypted Transmission:</strong> All data sent to emergency services uses military-grade AES-256 encryption with secure TLS connections.
          </p>
          <p>
            <strong className="text-foreground">Automatic Deletion:</strong> Skeletal recordings, audio clips, and transcripts are automatically deleted 24 hours after capture. No long-term storage of sensitive data.
          </p>
          <p>
            <strong className="text-foreground">Hospital Access Control:</strong> Emergency data is only shared with hospitals when you explicitly enable it or during confirmed emergencies. Access is logged and auditable.
          </p>
          <p>
            <strong className="text-foreground">Zero Knowledge Architecture:</strong> We cannot access your parent's monitoring feed. Only you and authorized emergency services (when dispatched) can view incident data.
          </p>
        </div>
      </Card>
    </div>
  );
}
