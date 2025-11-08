import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, Shield, Activity, MapPin, Clock, Bell, Smartphone } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/auth/signin";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <nav className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Heart className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">Elder Safety System</span>
            </div>
            <Button onClick={handleLogin} data-testid="button-login">
              Sign In
            </Button>
          </div>
        </div>
      </nav>

      <main>
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6" data-testid="text-hero-title">
              AI-Powered Elder Safety <br />& Emergency Response
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Real-time fall detection with skeletal tracking, automatic hospital dispatch,
              live ambulance GPS tracking, and dynamic vital signs monitoring.
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" onClick={handleLogin} data-testid="button-get-started">
                Get Started
              </Button>
              <Button size="lg" variant="outline" data-testid="button-learn-more">
                Learn More
              </Button>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-background">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Complete Emergency Response System
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="p-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Activity className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Real-Time Fall Detection</h3>
                <p className="text-muted-foreground">
                  MediaPipe AI skeletal tracking detects falls instantly with 10-second motion check to prevent false alarms.
                </p>
              </Card>

              <Card className="p-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">AI Hospital Dispatch</h3>
                <p className="text-muted-foreground">
                  Haversine formula automatically finds the nearest hospital based on GPS coordinates and specializations.
                </p>
              </Card>

              <Card className="p-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Smartphone className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Live Ambulance Tracking</h3>
                <p className="text-muted-foreground">
                  Uber/Ola-style real-time GPS tracking with ETA calculation, speed monitoring, and route visualization.
                </p>
              </Card>

              <Card className="p-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Dynamic Vitals Monitoring</h3>
                <p className="text-muted-foreground">
                  Continuous tracking of heart rate, blood pressure, oxygen saturation, respiratory rate, and glucose levels.
                </p>
              </Card>

              <Card className="p-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Bell className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Instant WebSocket Alerts</h3>
                <p className="text-muted-foreground">
                  Real-time emergency notifications via WebSocket for fall alerts, ambulance updates, and vitals changes.
                </p>
              </Card>

              <Card className="p-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Privacy & Security</h3>
                <p className="text-muted-foreground">
                  Skeletal-only monitoring mode, automatic data deletion, and encrypted storage in production PostgreSQL database.
                </p>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              How It Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  1
                </div>
                <h3 className="font-semibold mb-2">Fall Detected</h3>
                <p className="text-sm text-muted-foreground">
                  AI skeletal tracking identifies fall with 10-second motion verification
                </p>
              </div>

              <div className="text-center">
                <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  2
                </div>
                <h3 className="font-semibold mb-2">Nearest Hospital</h3>
                <p className="text-sm text-muted-foreground">
                  AI calculates distance to all hospitals and selects the closest
                </p>
              </div>

              <div className="text-center">
                <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  3
                </div>
                <h3 className="font-semibold mb-2">Ambulance Dispatch</h3>
                <p className="text-sm text-muted-foreground">
                  Available ambulance dispatched with ETA and route calculation
                </p>
              </div>

              <div className="text-center">
                <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  4
                </div>
                <h3 className="font-semibold mb-2">Live Tracking</h3>
                <p className="text-sm text-muted-foreground">
                  Real-time GPS updates via WebSocket with distance and speed monitoring
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-background border-t">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Keep Your Loved Ones Safe?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Start monitoring with AI-powered fall detection and emergency response today.
            </p>
            <Button size="lg" onClick={handleLogin} data-testid="button-cta">
              Sign In to Dashboard
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 px-4">
        <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
          <p>© 2024 Elder Safety System. Production-ready emergency response platform.</p>
        </div>
      </footer>
    </div>
  );
}
