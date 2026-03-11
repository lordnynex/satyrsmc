import { MEMBER_POSITIONS } from "@satyrsmc/shared/client";

export function uuid(): string {
  return crypto.randomUUID();
}

export const VALID_POSITIONS = new Set<string>(MEMBER_POSITIONS);

export const DEFAULT_SCENARIO_INPUTS = {
  profitTarget: 2500,
  staffCount: 14,
  maxOccupancy: 75,
  complimentaryTickets: 0,
  dayPassPrice: 50,
  dayPassesSold: 0,
  ticketPrices: {
    proposedPrice1: 200,
    proposedPrice2: 250,
    proposedPrice3: 300,
    staffPrice1: 150,
    staffPrice2: 125,
    staffPrice3: 100,
  },
};

export function parsePhotoToBlob(photo: string): Buffer | null {
  if (!photo || typeof photo !== "string") return null;
  const base64 = photo.includes(",") ? photo.split(",")[1] : photo;
  if (!base64) return null;
  try {
    return Buffer.from(base64, "base64");
  } catch {
    return null;
  }
}

export function memberRowToApi(m: Record<string, unknown>): {
  id: string;
  name: string;
  photo_url: string | null;
  photo_thumbnail_url: string | null;
} {
  const id = m.id as string;
  const hasPhoto = m.photo != null || m.has_photo === true;
  return {
    id,
    name: m.name as string,
    photo_url: hasPhoto ? `/api/members/${id}/photo?size=full` : null,
    photo_thumbnail_url: hasPhoto ? `/api/members/${id}/photo?size=thumbnail` : null,
  };
}
