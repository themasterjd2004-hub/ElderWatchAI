import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Hospital, Clock, Shield, MapPin, User, Video, Mic, Activity, Phone } from "lucide-react";

interface EmergencyDispatchData {
  fallAlert: any;
  hospital: any;
  etaMinutes: number;
  confidence: number;
  destination: { lat: number; lng: number };
}

interface DashboardEmergencyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: EmergencyDispatchData;
  onConfirm: () => void;
  onCancel: () => void;
  countdown?: number | null;
}

export default function DashboardEmergencyDialog({
  open,
  onOpenChange,
  data,
  onConfirm,
  onCancel,
  countdown,
}: DashboardEmergencyDialogProps) {
  const { hospital, etaMinutes, confidence, destination } = data;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-emergency-confirm">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <AlertDialogTitle className="text-2xl">Confirm Emergency Dispatch</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base">
            {countdown !== null && countdown !== undefined ? (
              <span className="flex items-center gap-2">
                <span className="font-bold text-destructive text-lg">{countdown}s</span>
                <span>No movement found. Emergency services will be dispatched automatically</span>
              </span>
            ) : (
              "This will send emergency services to your parent's location"
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-6 py-4">
          {/* Incident Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Incident Type</div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="font-medium" data-testid="text-incident-type">Fall Detected</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">AI Confidence</div>
              <div className="flex items-center gap-2">
                <Badge variant="destructive" className="text-base" data-testid="badge-confidence">
                  {Math.round(confidence * 100)}%
                </Badge>
              </div>
            </div>
          </div>

          {/* Hospital Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Nearest Hospital</div>
              <div className="flex items-center gap-2">
                <Hospital className="h-4 w-4 text-medical-stable" />
                <span className="font-medium" data-testid="text-hospital-name">{hospital.name}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Estimated ETA</div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-medical-warning" />
                <span className="font-medium" data-testid="text-eta">{etaMinutes} minutes</span>
              </div>
            </div>
          </div>

          {/* Data Being Sent */}
          <div className="space-y-3">
            <div className="text-sm font-medium">Data Being Sent</div>
            <div className="bg-muted/50 rounded-md p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm" data-testid="data-item-parent">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>Parent information & medical history</span>
              </div>
              <div className="flex items-center gap-2 text-sm" data-testid="data-item-location">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>Current location & GPS coordinates</span>
              </div>
              <div className="flex items-center gap-2 text-sm" data-testid="data-item-video">
                <Video className="h-4 w-4 text-muted-foreground" />
                <span>Skeletal motion video (10 seconds)</span>
              </div>
              <div className="flex items-center gap-2 text-sm" data-testid="data-item-audio">
                <Mic className="h-4 w-4 text-muted-foreground" />
                <span>Audio clips & speech transcript</span>
              </div>
              <div className="flex items-center gap-2 text-sm" data-testid="data-item-vitals">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span>Vital signs snapshot</span>
              </div>
              <div className="flex items-center gap-2 text-sm" data-testid="data-item-contact">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>Your contact information</span>
              </div>
            </div>
          </div>

          {/* Encryption Notice */}
          <div className="flex items-start gap-2 bg-primary/10 border border-primary/20 rounded-md p-3">
            <Shield className="h-4 w-4 text-primary mt-0.5" />
            <p className="text-sm" data-testid="text-encryption-notice">
              All data is encrypted with AES-256 and will be deleted after 24 hours
            </p>
          </div>
        </div>

        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel onClick={onCancel} data-testid="button-cancel">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive hover:bg-destructive/90"
            data-testid="button-confirm-dispatch"
          >
            Confirm Dispatch
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
