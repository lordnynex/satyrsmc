import { useAuth } from "@/state/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="text-2xl font-bold">My Profile</h1>
      <Card>
        <CardHeader>
          <CardTitle>{user?.username ?? "Profile"}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}
