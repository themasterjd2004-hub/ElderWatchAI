import IncidentTimeline from "@/components/IncidentTimeline";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Download, Filter } from "lucide-react";
import { useState } from "react";

export default function History() {
  const [filter, setFilter] = useState("all");

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Incident History</h1>
        <p className="text-muted-foreground mt-1">
          Review past monitoring events and responses
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
            Total Incidents
          </p>
          <p className="text-3xl font-bold">24</p>
          <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
            Resolved
          </p>
          <p className="text-3xl font-bold text-medical-stable">18</p>
          <p className="text-xs text-muted-foreground mt-1">75% of incidents</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
            False Alarms
          </p>
          <p className="text-3xl font-bold text-muted-foreground">6</p>
          <p className="text-xs text-muted-foreground mt-1">25% of incidents</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
            Avg Response
          </p>
          <p className="text-3xl font-bold font-mono">2m 29s</p>
          <p className="text-xs text-medical-stable mt-1">↓ 15% faster</p>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search incidents..."
                className="pl-9"
                data-testid="input-search"
              />
            </div>
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]" data-testid="select-filter">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Incidents</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="false-alarm">False Alarms</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" data-testid="button-export">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </Card>

      <IncidentTimeline />
    </div>
  );
}
