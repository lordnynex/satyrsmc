import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { Request, Response } from "express";
import type { Api } from "../services/api";
import type { UserType } from "@satyrsmc/shared/lib/enums";

export type Session = {
  userId: string;
  userType: UserType;
  memberId: string | null;
  contactId: string;
};

export type ContextOptions = {
  api: Api;
};

function parseCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]!) : null;
}

/**
 * Creates a per-request context for tRPC procedures.
 * Parses the JWT access token from cookies to populate the session.
 */
export function createContextFn(options: ContextOptions) {
  const { api } = options;
  return async function createContext({ req, res }: CreateExpressContextOptions) {
    let session: Session | null = null;

    const cookieHeader = req.headers["cookie"] ?? null;
    const accessToken = parseCookie(cookieHeader, "satyrs_access");

    if (accessToken) {
      const payload = await api.auth.verifyAccessToken(accessToken);
      if (payload) {
        session = {
          userId: payload.userId,
          userType: payload.userType,
          memberId: payload.memberId,
          contactId: payload.contactId,
        };
      }
    }

    return {
      req,
      res,
      api,
      session,
    };
  };
}

export type Context = {
  req: Request;
  res: Response;
  api: Api;
  session: Session | null;
};
