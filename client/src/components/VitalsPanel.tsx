import { Heart, Activity, MapPin, Waves } from "lucide-react";
import { Card } from "@/components/ui/card";

interface Vital {
  id: string;
  label: string;
  value: string;
  unit: string;
  status: "stable" | "warning" | "critical";
  icon: React.ReactNode;
  trend?: "up" | "down" | "stable";
}

interface VitalsPanelProps {
  vitals?: Vital[];
}

export default function VitalsPanel({ vitals }: VitalsPanelProps) {
  const defaultVitals: Vital[] = [
    {
      id: "heart",
      label: "Heart Rate",
      value: "72",
      unit: "BPM",
      status: "stable",
      icon: <Heart className="h-5 w-5" />,
      trend: "stable",
    },
    {
      id: "breathing",
      label: "Breathing",
      value: "16",
      unit: "per min",
      status: "stable",
      icon: <Waves className="h-5 w-5" />,
      trend: "stable",
    },
    {
      id: "motion",
      label: "Motion",
      value: "Low",
      unit: "",
      status: "stable",
      icon: <Activity className="h-5 w-5" />,
    },
    {
      id: "location",
      label: "GPS Accuracy",
      value: "High",
      unit: "",
      status: "stable",
      icon: <MapPin className="h-5 w-5" />,
    },
  ];

  const displayVitals = vitals || defaultVitals;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "critical":
        return "text-medical-critical";
      case "warning":
        return "text-medical-warning";
      case "stable":
        return "text-medical-stable";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {displayVitals.map((vital) => (
        <Card key={vital.id} className="p-4" data-testid={`card-vital-${vital.id}`}>
          <div className="flex items-start justify-between gap-2">
            <div className={`${getStatusColor(vital.status)}`}>
              {vital.icon}
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
              {vital.label}
            </p>
            <div className="flex items-baseline gap-1 mt-1">
              <p className="text-2xl font-mono font-bold" data-testid={`text-vital-value-${vital.id}`}>
                {vital.value}
              </p>
              {vital.unit && (
                <span className="text-sm text-muted-foreground">{vital.unit}</span>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
