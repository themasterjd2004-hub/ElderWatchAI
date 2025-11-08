import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User, Bell, Phone, MapPin, Save } from "lucide-react";
import { useState } from "react";
import parentPhoto from "@assets/generated_images/Elderly_parent_profile_photo_50154e6f.png";

export default function Settings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage account and monitoring preferences
        </p>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <User className="h-5 w-5" />
          Parent Profile
        </h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={parentPhoto} />
              <AvatarFallback>MW</AvatarFallback>
            </Avatar>
            <Button variant="outline" size="sm">Change Photo</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="parent-name">Full Name</Label>
              <Input
                id="parent-name"
                defaultValue="Margaret Wilson"
                data-testid="input-parent-name"
              />
            </div>
            <div>
              <Label htmlFor="parent-age">Age</Label>
              <Input
                id="parent-age"
                type="number"
                defaultValue="76"
                data-testid="input-parent-age"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="parent-address">Home Address</Label>
              <Input
                id="parent-address"
                defaultValue="123 Oak Street, Springfield, IL 62701"
                data-testid="input-parent-address"
              />
            </div>
            <div>
              <Label htmlFor="parent-phone">Phone Number</Label>
              <Input
                id="parent-phone"
                type="tel"
                defaultValue="(555) 123-4567"
                data-testid="input-parent-phone"
              />
            </div>
            <div>
              <Label htmlFor="emergency-contact">Emergency Contact</Label>
              <Input
                id="emergency-contact"
                defaultValue="Dr. Sarah Johnson - (555) 987-6543"
                data-testid="input-emergency-contact"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="medical-conditions">Medical Conditions</Label>
              <Input
                id="medical-conditions"
                defaultValue="Hypertension, Arthritis"
                data-testid="input-medical-conditions"
              />
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-muted-foreground">
                Receive alerts via email
              </p>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
              data-testid="switch-email-notifications"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">SMS Notifications</p>
              <p className="text-sm text-muted-foreground">
                Receive alerts via text message
              </p>
            </div>
            <Switch
              checked={smsNotifications}
              onCheckedChange={setSmsNotifications}
              data-testid="switch-sms-notifications"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Push Notifications</p>
              <p className="text-sm text-muted-foreground">
                Receive browser push notifications
              </p>
            </div>
            <Switch
              checked={pushNotifications}
              onCheckedChange={setPushNotifications}
              data-testid="switch-push-notifications"
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Emergency Contacts
        </h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="contact-1">Primary Contact</Label>
            <Input
              id="contact-1"
              defaultValue="John Smith - (555) 234-5678"
              data-testid="input-contact-1"
            />
          </div>
          <div>
            <Label htmlFor="contact-2">Secondary Contact</Label>
            <Input
              id="contact-2"
              defaultValue="Jane Smith - (555) 345-6789"
              data-testid="input-contact-2"
            />
          </div>
          <Button variant="outline" size="sm">
            + Add Another Contact
          </Button>
        </div>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline">Cancel</Button>
        <Button data-testid="button-save-settings">
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}
