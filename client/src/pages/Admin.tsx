import ProtectedRoute from "@/components/ProtectedRoute";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Users, UserPlus, Hospital, Ambulance } from "lucide-react";
import UserManagement from "@/components/admin/UserManagement";
import ParentManagement from "@/components/admin/ParentManagement";
import HospitalManagement from "@/components/admin/HospitalManagement";
import AmbulanceManagement from "@/components/admin/AmbulanceManagement";

export default function Admin() {
  return (
    <ProtectedRoute requireAdmin>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Admin Panel</h1>
          <p className="text-muted-foreground mt-1">
            Manage system users, parents, hospitals, and ambulance fleet
          </p>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Users</span>
            </TabsTrigger>
            <TabsTrigger value="parents" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              <span>Parents</span>
            </TabsTrigger>
            <TabsTrigger value="hospitals" className="flex items-center gap-2">
              <Hospital className="h-4 w-4" />
              <span>Hospitals</span>
            </TabsTrigger>
            <TabsTrigger value="ambulances" className="flex items-center gap-2">
              <Ambulance className="h-4 w-4" />
              <span>Ambulances</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="parents">
            <ParentManagement />
          </TabsContent>

          <TabsContent value="hospitals">
            <HospitalManagement />
          </TabsContent>

          <TabsContent value="ambulances">
            <AmbulanceManagement />
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}
