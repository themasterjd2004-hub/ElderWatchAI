import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Shield, MapPin, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface EmergencyDispatchModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onConfirm?: () => void;
  incidentType?: string;
  confidence?: number;
  hospitalName?: string;
  eta?: string;
}

export default function EmergencyDispatchModal({
  open = true,
  onOpenChange,
  onConfirm,
  incidentType = "Fall Detected",
  confidence = 92,
  hospitalName = "St. Mary's Medical Center",
  eta = "8 minutes",
}: EmergencyDispatchModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="modal-emergency-dispatch">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <DialogTitle>Confirm Emergency Dispatch</DialogTitle>
              <DialogDescription>
                This will send emergency services to your parent's location
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 bg-muted rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Incident Type</span>
              <Badge className="bg-destructive text-white">{incidentType}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">AI Confidence</span>
              <span className="text-sm font-mono font-semibold">{confidence}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Nearest Hospital</span>
              <span className="text-sm">{hospitalName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Estimated ETA</span>
              <span className="text-sm font-semibold">{eta}</span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Data Being Sent
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1 pl-6">
              <li className="list-disc">Parent information & medical history</li>
              <li className="list-disc">Current location & GPS coordinates</li>
              <li className="list-disc">Skeletal motion video (10 seconds)</li>
              <li className="list-disc">Audio clips & speech transcript</li>
              <li className="list-disc">Vital signs snapshot</li>
              <li className="list-disc">Your contact information</li>
            </ul>
          </div>

          <div className="p-3 bg-primary/10 rounded-lg flex items-start gap-2">
            <Shield className="h-4 w-4 text-primary mt-0.5" />
            <p className="text-xs text-primary">
              All data is encrypted with AES-256 and will be deleted after 24 hours
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => {
              console.log("Emergency dispatch cancelled");
              onOpenChange?.(false);
            }}
            data-testid="button-cancel-dispatch"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              console.log("Emergency confirmed");
              onConfirm?.();
              onOpenChange?.(false);
            }}
            data-testid="button-confirm-dispatch"
          >
            <Phone className="h-4 w-4 mr-2" />
            Confirm Dispatch
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
