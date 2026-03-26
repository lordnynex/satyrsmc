import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { navLinkClass } from "@/lib/utils";
import { useAuth } from "@/state/AuthContext";

export function MemberNavLinks() {
  const { isMember, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const close = () => setOpen(false);

  async function handleLogout() {
    close();
    await logout();
    navigate("/login");
  }

  return (
    <>
      {/* Desktop nav */}
      <div className="hidden md:flex items-center ml-auto">
        <NavLink to="/" end className={navLinkClass}>
          Dashboard
        </NavLink>
        <NavLink to="/events" className={navLinkClass}>
          Events
        </NavLink>
        {isMember && (
          <NavLink to="/roster" className={navLinkClass}>
            Roster
          </NavLink>
        )}
        {isAdmin && (
          <>
            <div className="ml-1 pl-1 border-l border-white/20 h-5" />
            <NavLink to="/admin" className={navLinkClass}>
              Admin
            </NavLink>
          </>
        )}
      </div>

      {/* Mobile toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="member-mobile-nav"
        className="md:hidden ml-auto flex items-center gap-2 px-3 py-2 rounded-md border border-white/20 text-white/70 hover:bg-white/10 hover:text-white text-sm font-medium transition-colors"
      >
        Menu
      </button>

      {/* Mobile dropdown */}
      {open && (
        <div
          id="member-mobile-nav"
          className="md:hidden basis-full w-full flex flex-col gap-0.5 mt-2 pb-2"
        >
          <NavLink to="/" end onClick={close} className={navLinkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/events" onClick={close} className={navLinkClass}>
            Events
          </NavLink>
          {isMember && (
            <NavLink to="/roster" onClick={close} className={navLinkClass}>
              Roster
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin" onClick={close} className={navLinkClass}>
              Admin
            </NavLink>
          )}
          <div className="mt-2 pt-2 border-t border-white/10 flex flex-col gap-0.5">
            <NavLink to="/settings/profile" onClick={close} className={navLinkClass}>
              Profile
            </NavLink>
            <NavLink to="/settings/account" onClick={close} className={navLinkClass}>
              Account
            </NavLink>
            <button onClick={handleLogout} className={navLinkClass({ isActive: false })}>
              Log Out
            </button>
          </div>
        </div>
      )}
    </>
  );
}
