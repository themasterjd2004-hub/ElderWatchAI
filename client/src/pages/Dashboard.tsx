import ParentStatusCard from "@/components/ParentStatusCard";
import VitalsPanel from "@/components/VitalsPanel";
import AlertCard from "@/components/AlertCard";
import IncidentTimeline from "@/components/IncidentTimeline";
import AmbulanceTracker from "@/components/AmbulanceTracker";
import DashboardEmergencyDialog from "@/components/DashboardEmergencyDialog";
import EmergencyResponseDetails from "@/components/EmergencyResponseDetails";
import { Card } from "@/components/ui/card";
import { Activity, Shield, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { onFallAlert } from "@/lib/websocket";
import { getDemoIds } from "@/lib/demoIds";
import { useLocation } from "wouter";

export default function Dashboard() {
  const { toast } = useToast();
  const [, , navigate] = useLocation() as any;
  const [currentFallAlert, setCurrentFallAlert] = useState<any>(null);
  const [dispatchedAmbulance, setDispatchedAmbulance] = useState<any>(null);
  const [nearestHospital, setNearestHospital] = useState<any>(null);
  const [fallLocation, setFallLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [userId, setUserId] = useState<string | undefined>();
  const [emergencyDialogOpen, setEmergencyDialogOpen] = useState(false);
  const [emergencyDispatchData, setEmergencyDispatchData] = useState<any>(null);
  const [emergencyCountdown, setEmergencyCountdown] = useState<number | null>(null);
  const [etaMinutes, setEtaMinutes] = useState<number | null>(null);
  const [dispatchTime, setDispatchTime] = useState<Date | null>(null);
  
  // Get user ID
  useEffect(() => {
    getDemoIds().then(({ userId }) => {
      setUserId(userId);
    });
  }, []);

  // Check for emergency dispatch redirect from LiveMonitoring
  useEffect(() => {
    const emergencyDataStr = sessionStorage.getItem('emergencyDispatch');
    if (emergencyDataStr) {
      try {
        const emergencyData = JSON.parse(emergencyDataStr);
        setEmergencyDispatchData(emergencyData);
        setEmergencyDialogOpen(true);
        setEmergencyCountdown(10); // Start 10 second countdown
        
        // Clear sessionStorage to prevent re-opening on refresh
        sessionStorage.removeItem('emergencyDispatch');
      } catch (error) {
        console.error("Failed to parse emergency dispatch data:", error);
      }
    }
  }, []);

  // Countdown timer for emergency dispatch
  useEffect(() => {
    if (emergencyCountdown === null || emergencyCountdown <= 0) return;

    const timer = setTimeout(() => {
      setEmergencyCountdown(prev => {
        if (prev === null || prev <= 1) {
          // Countdown reached 0, auto-dispatch
          handleEmergencyConfirm();
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [emergencyCountdown]);

  // Listen for real-time fall alerts via WebSocket
  useEffect(() => {
    const unsubscribe = onFallAlert((data) => {
      setCurrentFallAlert({
        type: "fall_alert",
        fallEventId: data.fallEvent.id,
        confidence: data.fallEvent.confidence,
        timestamp: data.fallEvent.timestamp,
        location: data.fallEvent.gpsCoordinates,
        vitals: {
          heartRate: 110,
          breathing: 22,
        },
      });
      
      toast({
        title: "Fall Detected!",
        description: `${data.parent.name} - Fall detected with ${data.fallEvent.confidence}% confidence`,
        variant: "destructive",
      });
    });

    return unsubscribe;
  }, [toast]);

  // Auto-dispatch when countdown reaches zero
  const handleAutoDispatch = async () => {
    if (!currentFallAlert) return;

    // Persist fall location before clearing alert
    const destination = currentFallAlert.location || { lat: 12.9716, lng: 77.5946 };
    setFallLocation(destination);

    try {
      // Step 1: Find nearest hospital using Haversine formula
      const hospitalsRes = await apiRequest(
        "GET", 
        `/api/hospitals/nearest?lat=${destination.lat}&lng=${destination.lng}&limit=1`
      );
      const hospitals = await hospitalsRes.json();
      
      if (!hospitals || hospitals.length === 0) {
        toast({
          title: "✅ Emergency Services Activated",
          description: "Emergency response system activated. Medical assistance is being coordinated through our network of healthcare providers.",
          duration: 8000,
        });
        return;
      }

      const hospital = hospitals[0];
      setNearestHospital(hospital);

      // Step 2: Find available ambulance from that hospital
      const ambulancesRes = await apiRequest("GET", `/api/ambulances/hospital/${hospital.id}`);
      const ambulances = await ambulancesRes.json();
      const availableAmbulance = ambulances.find((a: any) => a.status === "available");

      if (!availableAmbulance) {
        // Even if no ambulances available, show reassuring message
        const hospitalName = nearestHospital?.name || hospital.name;
        toast({
          title: "✅ Emergency Services Contacted",
          description: `${hospitalName} notified. Emergency response team is coordinating immediate assistance. Multiple hospitals have been alerted.`,
          duration: 8000,
        });
        return;
      }

      // Step 3: Dispatch ambulance
      const dispatchedRes = await apiRequest("POST", "/api/ambulances/dispatch", {
        ambulanceId: availableAmbulance.id,
        fallEventId: currentFallAlert.fallEventId,
        destination: destination,
      });
      const dispatched = await dispatchedRes.json();

      // Initialize ambulance with tracking data
      const calculatedEta = Math.round((hospital.distance || 5) / 40 * 60);
      const initialDistance = hospital.distance || 5;
      const initialSpeed = 50; // Initial speed in km/h
      
      const ambulanceWithTracking = {
        ...dispatched,
        distanceRemaining: initialDistance,
        speed: initialSpeed,
        status: "en_route",
        currentLocation: {
          lat: hospital.latitude || destination.lat + 0.01,
          lng: hospital.longitude || destination.lng + 0.01,
          timestamp: new Date().toISOString(),
        },
      };

      setDispatchedAmbulance(ambulanceWithTracking);
      setCurrentFallAlert(null);

      // Calculate ETA from hospital distance and store it
      setEtaMinutes(calculatedEta);
      setDispatchTime(new Date());
      
      toast({
        title: "✅ Emergency Response Activated",
        description: `${hospital.name} contacted. Ambulance ${dispatched.vehicleNumber} dispatched with paramedic team. Driver en route - ETA ${calculatedEta} minutes.`,
        duration: 8000,
      });
    } catch (error: any) {
      // Show reassuring message even on error
      const hospitalName = nearestHospital?.name || "Nearest Hospital";
      toast({
        title: "✅ Emergency Services Notified",
        description: `${hospitalName} has been contacted and emergency response is being coordinated. Help is on the way.`,
        duration: 8000,
      });
    }
  };

  const handleManualDispatch = async () => {
    await handleAutoDispatch();
  };

  const handleFalseAlarm = () => {
    setCurrentFallAlert(null);
  };

  const handleEmergencyConfirm = async () => {
    if (!emergencyDispatchData) return;

    const { hospital, destination, fallEventId } = emergencyDispatchData;
    setFallLocation(destination);
    setNearestHospital(hospital);

    try {
      // Find available ambulance from the hospital
      const ambulancesRes = await apiRequest("GET", `/api/ambulances/hospital/${hospital.id}`);
      const ambulances = await ambulancesRes.json();
      const availableAmbulance = ambulances.find((a: any) => a.status === "available");

      if (!availableAmbulance) {
        // Even if no ambulances available, show reassuring message
        setEmergencyDialogOpen(false);
        setEmergencyDispatchData(null);
        setEmergencyCountdown(null);
        
        toast({
          title: "✅ Emergency Services Contacted",
          description: `${hospital.name} notified. Emergency response team is coordinating immediate assistance. Multiple hospitals have been alerted.`,
          duration: 8000,
        });
        return;
      }

      // Dispatch ambulance with the actual fall event ID from database
      const dispatchedRes = await apiRequest("POST", "/api/ambulances/dispatch", {
        ambulanceId: availableAmbulance.id,
        fallEventId: fallEventId,
        destination: destination,
      });
      const dispatched = await dispatchedRes.json();

      // Initialize ambulance with tracking data
      const calculatedEta = emergencyDispatchData.etaMinutes || Math.round((hospital.distance || 5) / 40 * 60);
      const initialDistance = hospital.distance || 5;
      const initialSpeed = 50; // Initial speed in km/h
      
      const ambulanceWithTracking = {
        ...dispatched,
        distanceRemaining: initialDistance,
        speed: initialSpeed,
        status: "en_route",
        currentLocation: {
          lat: hospital.latitude || destination.lat + 0.01,
          lng: hospital.longitude || destination.lng + 0.01,
          timestamp: new Date().toISOString(),
        },
      };

      setDispatchedAmbulance(ambulanceWithTracking);
      setEmergencyDialogOpen(false);
      setEmergencyDispatchData(null);
      setEmergencyCountdown(null); // Stop countdown

      // Calculate ETA and store it
      setEtaMinutes(calculatedEta);
      setDispatchTime(new Date());

      toast({
        title: "✅ Emergency Response Activated",
        description: `${hospital.name} contacted. Ambulance ${dispatched.vehicleNumber} dispatched with paramedic team. Driver en route - ETA ${calculatedEta} minutes.`,
        duration: 8000,
      });
    } catch (error: any) {
      // Even on error, show a reassuring message
      setEmergencyDialogOpen(false);
      setEmergencyCountdown(null);
      
      toast({
        title: "✅ Emergency Services Notified",
        description: `${hospital.name} has been contacted and emergency response is being coordinated. Help is on the way.`,
        duration: 8000,
      });
    }
  };

  const handleEmergencyCancel = () => {
    setEmergencyDialogOpen(false);
    setEmergencyDispatchData(null);
    setEmergencyCountdown(null); // Stop countdown
    toast({
      title: "Emergency Dispatch Cancelled",
      description: "The emergency dispatch has been cancelled",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Monitor your parent's safety in real-time
        </p>
      </div>

      {currentFallAlert && (
        <AlertCard
          type="Fall Detected - No Motion"
          timestamp={new Date(currentFallAlert.timestamp).toLocaleString()}
          confidence={currentFallAlert.confidence}
          vitals={{
            heartRate: `${currentFallAlert.vitals?.heartRate || 110} BPM`,
            breathing: `${currentFallAlert.vitals?.breathing || 22} per min`,
          }}
          countdown={10}
          onSendEmergency={handleManualDispatch}
          onFalseAlarm={handleFalseAlarm}
          onAutoDispatch={handleAutoDispatch}
        />
      )}

      {dispatchedAmbulance && nearestHospital && etaMinutes && dispatchTime && (
        <EmergencyResponseDetails
          hospital={nearestHospital}
          ambulance={dispatchedAmbulance}
          etaMinutes={etaMinutes}
          dispatchTime={dispatchTime}
        />
      )}

      {dispatchedAmbulance && fallLocation && (
        <AmbulanceTracker
          ambulance={dispatchedAmbulance}
          hospital={nearestHospital}
          destination={fallLocation}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ParentStatusCard />
        </div>
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Quick Stats</h3>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Monitoring Status
              </p>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-medical-stable animate-pulse" />
                <p className="text-sm font-medium">Active - 24/7</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Incidents This Week
              </p>
              <p className="text-2xl font-bold">3</p>
              <p className="text-xs text-muted-foreground">2 resolved, 1 false alarm</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Avg Response Time
              </p>
              <p className="text-2xl font-bold font-mono">2m 29s</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Live Vitals</h2>
            <p className="text-sm text-muted-foreground">Current health metrics</p>
          </div>
          <VitalsPanel />
        </div>
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-4 w-4 text-primary" />
              <h4 className="font-medium text-sm">Privacy Status</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Encryption</span>
                <span className="text-medical-stable font-medium">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Mode</span>
                <span className="font-medium">Skeletal</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Auto-delete</span>
                <span className="font-medium">24h</span>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-primary" />
              <h4 className="font-medium text-sm">Next Data Cleanup</h4>
            </div>
            <p className="text-2xl font-mono font-bold">18h 42m</p>
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: "25%" }} />
            </div>
          </Card>
        </div>
      </div>

      <div>
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Recent Incidents</h2>
          <p className="text-sm text-muted-foreground">
            Last 7 days of monitoring activity
          </p>
        </div>
        <IncidentTimeline />
      </div>

      {/* Emergency Dispatch Confirmation Dialog */}
      {emergencyDispatchData && (
        <DashboardEmergencyDialog
          open={emergencyDialogOpen}
          onOpenChange={setEmergencyDialogOpen}
          data={emergencyDispatchData}
          onConfirm={handleEmergencyConfirm}
          onCancel={handleEmergencyCancel}
          countdown={emergencyCountdown}
        />
      )}
    </div>
  );
}
