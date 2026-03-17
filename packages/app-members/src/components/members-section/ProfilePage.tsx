import { Navigate } from "react-router-dom";
import { useAuth } from "@/state/AuthContext";

export function ProfilePage() {
  const { user } = useAuth();

  if (!user?.username) {
    return <Navigate to="/" replace />;
  }

  return <Navigate to={`/roster/${user.username}`} replace />;
}
