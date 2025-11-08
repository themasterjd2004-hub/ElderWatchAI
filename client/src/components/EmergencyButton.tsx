import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface EmergencyButtonProps {
  onClick?: () => void;
  hasAlert?: boolean;
}

export default function EmergencyButton({
  onClick,
  hasAlert = false,
}: EmergencyButtonProps) {
  return (
    <Button
      size="icon"
      variant="destructive"
      className={`h-14 w-14 rounded-full fixed bottom-6 right-6 z-50 shadow-lg ${
        hasAlert ? "animate-pulse" : ""
      }`}
      onClick={() => {
        console.log("Emergency button clicked");
        onClick?.();
      }}
      data-testid="button-emergency"
    >
      <AlertTriangle className="h-6 w-6" />
    </Button>
  );
}
