import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { User, Bell, Phone, Save, X, Plus, Upload } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import parentPhoto from "@assets/generated_images/Elderly_parent_profile_photo_50154e6f.png";

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
}

export default function Settings() {
  const { toast } = useToast();
  
  // Parent profile state
  const [fullName, setFullName] = useState("Margaret Wilson");
  const [age, setAge] = useState("76");
  const [homeAddress, setHomeAddress] = useState("123 Oak Street, Springfield, IL 62701");
  const [phoneNumber, setPhoneNumber] = useState("(555) 123-4567");
  const [emergencyContact, setEmergencyContact] = useState("Dr. Sarah Johnson - (555) 987-6543");
  const [medicalConditions, setMedicalConditions] = useState("Hypertension, Arthritis");
  const [photoUrl, setPhotoUrl] = useState(parentPhoto);

  // Notification preferences state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);

  // Emergency contacts state
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
    { id: "1", name: "John Smith", phone: "(555) 234-5678" },
    { id: "2", name: "Jane Smith", phone: "(555) 345-6789" },
  ]);

  const handlePhotoChange = () => {
    toast({
      title: "Photo Upload",
      description: "Photo upload feature coming soon",
    });
  };

  const handleAddContact = () => {
    const newContact: EmergencyContact = {
      id: Date.now().toString(),
      name: "",
      phone: "",
    };
    setEmergencyContacts([...emergencyContacts, newContact]);
  };

  const handleRemoveContact = (id: string) => {
    if (emergencyContacts.length <= 1) {
      toast({
        title: "Cannot Remove",
        description: "You must have at least one emergency contact",
        variant: "destructive",
      });
      return;
    }
    setEmergencyContacts(emergencyContacts.filter((c) => c.id !== id));
  };

  const handleContactChange = (id: string, field: "name" | "phone", value: string) => {
    setEmergencyContacts(
      emergencyContacts.map((c) =>
        c.id === id ? { ...c, [field]: value } : c
      )
    );
  };

  const handleCancel = () => {
    // Reset all fields to original values
    setFullName("Margaret Wilson");
    setAge("76");
    setHomeAddress("123 Oak Street, Springfield, IL 62701");
    setPhoneNumber("(555) 123-4567");
    setEmergencyContact("Dr. Sarah Johnson - (555) 987-6543");
    setMedicalConditions("Hypertension, Arthritis");
    setEmailNotifications(true);
    setSmsNotifications(true);
    setPushNotifications(true);
    setEmergencyContacts([
      { id: "1", name: "John Smith", phone: "(555) 234-5678" },
      { id: "2", name: "Jane Smith", phone: "(555) 345-6789" },
    ]);
    
    toast({
      title: "Changes Discarded",
      description: "All changes have been reset",
    });
  };

  const handleSave = () => {
    // Validate required fields
    if (!fullName.trim()) {
      toast({
        title: "Validation Error",
        description: "Full name is required",
        variant: "destructive",
      });
      return;
    }

    // Check if all emergency contacts have names and phones
    const invalidContacts = emergencyContacts.some((c) => !c.name.trim() || !c.phone.trim());
    if (invalidContacts) {
      toast({
        title: "Validation Error",
        description: "All emergency contacts must have a name and phone number",
        variant: "destructive",
      });
      return;
    }

    // Save settings (this would normally be an API call)
    toast({
      title: "Settings Saved",
      description: "Your settings have been updated successfully",
    });
  };

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
              <AvatarImage src={photoUrl} />
              <AvatarFallback>
                {fullName.split(" ").map((n) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handlePhotoChange}
              data-testid="button-change-photo"
            >
              <Upload className="h-4 w-4 mr-2" />
              Change Photo
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="parent-name">Full Name</Label>
              <Input
                id="parent-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                data-testid="input-parent-name"
              />
            </div>
            <div>
              <Label htmlFor="parent-age">Age</Label>
              <Input
                id="parent-age"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                data-testid="input-parent-age"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="parent-address">Home Address</Label>
              <Input
                id="parent-address"
                value={homeAddress}
                onChange={(e) => setHomeAddress(e.target.value)}
                data-testid="input-parent-address"
              />
            </div>
            <div>
              <Label htmlFor="parent-phone">Phone Number</Label>
              <Input
                id="parent-phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                data-testid="input-parent-phone"
              />
            </div>
            <div>
              <Label htmlFor="emergency-contact">Emergency Contact</Label>
              <Input
                id="emergency-contact"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                data-testid="input-emergency-contact"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="medical-conditions">Medical Conditions</Label>
              <Textarea
                id="medical-conditions"
                value={medicalConditions}
                onChange={(e) => setMedicalConditions(e.target.value)}
                placeholder="Enter medical conditions separated by commas"
                data-testid="input-medical-conditions"
                rows={2}
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
          {emergencyContacts.map((contact, index) => (
            <div key={contact.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>
                  {index === 0 ? "Primary Contact" : index === 1 ? "Secondary Contact" : `Contact ${index + 1}`}
                </Label>
                {emergencyContacts.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveContact(contact.id)}
                    data-testid={`button-remove-contact-${contact.id}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Input
                  placeholder="Name"
                  value={contact.name}
                  onChange={(e) => handleContactChange(contact.id, "name", e.target.value)}
                  data-testid={`input-contact-name-${contact.id}`}
                />
                <Input
                  placeholder="Phone Number"
                  type="tel"
                  value={contact.phone}
                  onChange={(e) => handleContactChange(contact.id, "phone", e.target.value)}
                  data-testid={`input-contact-phone-${contact.id}`}
                />
              </div>
            </div>
          ))}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleAddContact}
            data-testid="button-add-contact"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Another Contact
          </Button>
        </div>
      </Card>

      <div className="flex justify-end gap-2">
        <Button 
          variant="outline" 
          onClick={handleCancel}
          data-testid="button-cancel-settings"
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSave}
          data-testid="button-save-settings"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}
