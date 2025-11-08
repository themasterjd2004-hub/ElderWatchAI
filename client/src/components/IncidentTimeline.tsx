import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface Incident {
  id: string;
  type: string;
  timestamp: string;
  confidence: number;
  status: "resolved" | "false-alarm" | "pending";
  responseTime?: string;
  details?: string;
}

interface IncidentTimelineProps {
  incidents?: Incident[];
}

export default function IncidentTimeline({ incidents }: IncidentTimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const defaultIncidents: Incident[] = [
    {
      id: "1",
      type: "Fall Detected",
      timestamp: "Today, 2:34 PM",
      confidence: 92,
      status: "resolved",
      responseTime: "3m 45s",
      details: "Emergency services dispatched. Parent confirmed safe.",
    },
    {
      id: "2",
      type: "Unusual Motion",
      timestamp: "Yesterday, 8:12 AM",
      confidence: 78,
      status: "false-alarm",
      responseTime: "1m 12s",
      details: "Parent marked as false alarm. Was doing exercises.",
    },
    {
      id: "3",
      type: "Audio Distress",
      timestamp: "2 days ago, 11:45 PM",
      confidence: 85,
      status: "resolved",
      responseTime: "2m 30s",
      details: "Phone call placed. Parent was watching a movie.",
    },
  ];

  const displayIncidents = incidents || defaultIncidents;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "resolved":
        return <CheckCircle2 className="h-5 w-5 text-medical-stable" />;
      case "false-alarm":
        return <XCircle className="h-5 w-5 text-muted-foreground" />;
      case "pending":
        return <AlertTriangle className="h-5 w-5 text-medical-warning" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "resolved":
        return "Resolved";
      case "false-alarm":
        return "False Alarm";
      case "pending":
        return "Pending";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-4" data-testid="container-incident-timeline">
      {displayIncidents.map((incident) => (
        <Card key={incident.id} className="overflow-hidden" data-testid={`card-incident-${incident.id}`}>
          <div className="p-4">
            <div className="flex items-start gap-4">
              <div className="mt-1">{getStatusIcon(incident.status)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <h4 className="font-semibold">{incident.type}</h4>
                    <p className="text-sm text-muted-foreground">
                      {incident.timestamp}
                    </p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Badge variant="outline">{incident.confidence}%</Badge>
                    <Badge variant="secondary">
                      {getStatusLabel(incident.status)}
                    </Badge>
                  </div>
                </div>

                {incident.responseTime && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Response time: {incident.responseTime}
                  </p>
                )}

                {expandedId === incident.id && incident.details && (
                  <div className="mt-3 p-3 bg-muted rounded-lg">
                    <p className="text-sm">{incident.details}</p>
                  </div>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() =>
                    setExpandedId(expandedId === incident.id ? null : incident.id)
                  }
                  data-testid={`button-expand-${incident.id}`}
                >
                  {expandedId === incident.id ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      Show More
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
