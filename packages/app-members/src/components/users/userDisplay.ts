import { UserStatus, UserType } from "@satyrsmc/shared/lib/enums";

export const STATUS_LABELS: Record<UserStatus, string> = {
  [UserStatus.Active]: "Active",
  [UserStatus.Locked]: "Locked",
  [UserStatus.Rejected]: "Rejected",
  [UserStatus.Suspended]: "Suspended",
  [UserStatus.Inactive]: "Inactive",
  [UserStatus.Deactivated]: "Deactivated",
};

export const STATUS_COLORS: Record<UserStatus, string> = {
  [UserStatus.Active]: "bg-green-100 text-green-800",
  [UserStatus.Locked]: "bg-yellow-100 text-yellow-800",
  [UserStatus.Rejected]: "bg-red-100 text-red-800",
  [UserStatus.Suspended]: "bg-orange-100 text-orange-800",
  [UserStatus.Inactive]: "bg-gray-100 text-gray-600",
  [UserStatus.Deactivated]: "bg-gray-100 text-gray-400",
};

export const TYPE_LABELS: Record<UserType, string> = {
  [UserType.User]: "User",
  [UserType.Admin]: "Admin",
  [UserType.Webmaster]: "Webmaster",
};
