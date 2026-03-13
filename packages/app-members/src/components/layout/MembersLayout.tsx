import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/state/AuthContext";
import { BrandHeader, BrandFooter } from "@satyrsmc/shared/components";

export function MembersLayout() {
  const { user, logout, isMember, isAdmin } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen flex flex-col text-white bg-satyrs-dark">
      <BrandHeader>
        <nav className="flex items-center gap-1">
          <Link to="/" className="px-2.5 py-1.5 rounded text-sm hover:bg-white/10">
            Dashboard
          </Link>
          <Link to="/events" className="px-2.5 py-1.5 rounded text-sm hover:bg-white/10">
            Events
          </Link>
          {isMember && (
            <Link to="/roster" className="px-2.5 py-1.5 rounded text-sm hover:bg-white/10">
              Roster
            </Link>
          )}
          <Link to="/profile" className="px-2.5 py-1.5 rounded text-sm hover:bg-white/10">
            Profile
          </Link>
          {isAdmin && (
            <>
              <div className="ml-1 pl-1 border-l border-slate-600/40 h-5" />
              <Link to="/admin" className="px-2.5 py-1.5 rounded text-sm hover:bg-white/10">
                Admin
              </Link>
            </>
          )}
        </nav>
        <div className="flex items-center gap-3">
          <span className="text-sm text-white/70">{user?.username}</span>
          <button
            className="px-2.5 py-1.5 rounded text-sm border border-white/30 hover:bg-white/10 transition-colors"
            onClick={handleLogout}
          >
            Log Out
          </button>
        </div>
      </BrandHeader>
      <main className="flex-1">
        <Outlet />
      </main>
      <BrandFooter />
    </div>
  );
}
