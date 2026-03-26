import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export { isValidUuid } from "@satyrsmc/shared/lib/uuid";
export { navLinkClass } from "@satyrsmc/shared/lib/nav";
