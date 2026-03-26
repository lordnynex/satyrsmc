import React from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { useAuth } from "@/state/AuthContext";
import { trpc } from "@/trpc";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserAvatar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { data: profile } = trpc.members.profile.getOwnSettings.useQuery();
  const [open, setOpen] = React.useState(false);

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="hidden md:block ml-3">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button
            className="focus:outline-none"
            aria-label="User menu"
            onMouseEnter={() => setOpen(true)}
          >
            <Avatar src={profile?.photo_url} alt="Your avatar" className="size-8 cursor-pointer" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem
            asChild
            className="cursor-pointer focus:bg-satyrs-blue/20 focus:text-white"
          >
            <NavLink to="/settings/profile">Profile</NavLink>
          </DropdownMenuItem>
          <DropdownMenuItem
            asChild
            className="cursor-pointer focus:bg-satyrs-blue/20 focus:text-white"
          >
            <NavLink to="/settings/account">Account</NavLink>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            className="cursor-pointer focus:bg-satyrs-blue/20 focus:text-white"
          >
            Log Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
