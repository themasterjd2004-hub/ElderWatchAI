import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Mail, Phone } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export default function UserManagement() {
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: false, // Will be enabled when backend endpoint is ready
  });

  if (isLoading) {
    return <div>Loading users...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">System Users</h2>
          <p className="text-sm text-muted-foreground">
            Manage user accounts and permissions
          </p>
        </div>
        <Button data-testid="button-add-user">
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      <div className="grid gap-4">
        {/* Demo user for display */}
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold">Demo User</h3>
                <Badge variant="secondary">Admin</Badge>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>demo@example.com</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>(555) 234-5678</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" data-testid="button-edit-user">
                Edit
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-8 text-center text-muted-foreground">
          <p>User management UI coming soon</p>
          <p className="text-sm mt-2">Backend API is ready - frontend integration in progress</p>
        </Card>
      </div>
    </div>
  );
}
