import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock } from "lucide-react";
import { useState, useEffect } from "react";

interface AlertCardProps {
  type?: string;
  timestamp?: string;
  confidence?: number;
  vitals?: {
    heartRate: string;
    breathing: string;
  };
  countdown?: number;
  onSendEmergency?: () => void;
  onFalseAlarm?: () => void;
  onViewDetails?: () => void;
}

export default function AlertCard({
  type = "Fall Detected",
  timestamp = new Date().toLocaleString(),
  confidence = 92,
  vitals = { heartRate: "110 BPM", breathing: "22 per min" },
  countdown = 60,
  onSendEmergency,
  onFalseAlarm,
  onViewDetails,
}: AlertCardProps) {
  const [timeLeft, setTimeLeft] = useState(countdown);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const progressPercentage = (timeLeft / countdown) * 100;

  return (
    <Card className="border-destructive border-2" data-testid="card-alert">
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-destructive/10 rounded-lg">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <h3 className="text-lg font-semibold" data-testid="text-alert-type">
                  {type}
                </h3>
                <p className="text-sm text-muted-foreground" data-testid="text-alert-timestamp">
                  {timestamp}
                </p>
              </div>
              <Badge
                className={
                  confidence >= 90
                    ? "bg-medical-critical text-white"
                    : confidence >= 70
                    ? "bg-medical-warning text-white"
                    : "bg-medical-monitoring text-white"
                }
                data-testid="badge-confidence"
              >
                {confidence}% Confidence
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-xs text-muted-foreground">Heart Rate</p>
                <p className="font-mono font-semibold">{vitals.heartRate}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Breathing</p>
                <p className="font-mono font-semibold">{vitals.breathing}</p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  Auto-dispatch in {timeLeft}s
                </span>
              </div>
              <div className="w-full bg-background rounded-full h-2">
                <div
                  className="bg-destructive h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4 flex-wrap">
              <Button
                variant="destructive"
                onClick={() => {
                  console.log("Emergency dispatched");
                  onSendEmergency?.();
                }}
                data-testid="button-send-emergency"
              >
                Send Emergency
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  console.log("Marked as false alarm");
                  onFalseAlarm?.();
                }}
                data-testid="button-false-alarm"
              >
                False Alarm
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  console.log("View details clicked");
                  onViewDetails?.();
                }}
                data-testid="button-view-details"
              >
                View Details
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
