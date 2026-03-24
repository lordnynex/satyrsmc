import type { DataSource } from "typeorm";
import type { InvitationPurpose } from "@satyrsmc/shared/lib/enums";
import type { InvitationOutput } from "@satyrsmc/shared/dto/admin/invitation";
import { Invitation } from "../entities";
import { uuid } from "./utils";
import { toISOStringOrNull } from "../lib/date";

function entityToOutput(e: Invitation): InvitationOutput {
  return {
    id: e.id,
    contactId: e.contactId,
    eventId: e.eventId,
    purpose: e.purpose,
    expiresAt: e.expiresAt instanceof Date ? e.expiresAt.toISOString() : String(e.expiresAt),
    claimedAt: toISOStringOrNull(e.claimedAt),
    rsvpId: e.rsvpId,
    createdUserId: e.createdUserId,
    createdAt: toISOStringOrNull(e.createdAt),
  };
}

function rowToEntity(
  repo: ReturnType<DataSource["getRepository"]>,
  row: Record<string, unknown>,
): Invitation {
  return repo.create({
    id: row.id as string,
    contactId: (row.contact_id as string) ?? null,
    tokenHash: row.token_hash as string,
    purpose: row.purpose as InvitationPurpose,
    eventId: (row.event_id as string) ?? null,
    createdByUserId: (row.created_by_user_id as string) ?? null,
    expiresAt: row.expires_at instanceof Date ? row.expires_at : new Date(row.expires_at as string),
    claimedAt:
      row.claimed_at instanceof Date
        ? row.claimed_at
        : row.claimed_at
          ? new Date(row.claimed_at as string)
          : null,
    rsvpId: (row.rsvp_id as string) ?? null,
    createdUserId: (row.created_user_id as string) ?? null,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at
        : row.created_at
          ? new Date(row.created_at as string)
          : null,
  }) as Invitation;
}

async function hashToken(raw: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(raw);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function generateToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export class InvitationService {
  constructor(private ds: DataSource) {}

  async create(data: {
    contactId?: string | null;
    purpose: InvitationPurpose;
    eventId?: string | null;
    createdByUserId?: string | null;
    expiresInDays?: number;
  }): Promise<InvitationOutput & { rawToken: string }> {
    const id = uuid();
    const rawToken = generateToken();
    const tokenHash = await hashToken(rawToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (data.expiresInDays ?? 30));
    const now = new Date();

    await this.ds.query(
      `INSERT INTO invitations (id, contact_id, token_hash, purpose, event_id, created_by_user_id, expires_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        id,
        data.contactId ?? null,
        tokenHash,
        data.purpose,
        data.eventId ?? null,
        data.createdByUserId ?? null,
        expiresAt,
        now,
      ],
    );

    return {
      id,
      contactId: data.contactId ?? null,
      eventId: data.eventId ?? null,
      purpose: data.purpose,
      expiresAt: expiresAt.toISOString(),
      claimedAt: null,
      rsvpId: null,
      createdUserId: null,
      createdAt: now.toISOString(),
      rawToken,
    };
  }

  async findByTokenHash(tokenHash: string): Promise<Invitation | null> {
    const rows = (await this.ds.query(`SELECT * FROM invitations WHERE token_hash = $1 LIMIT 1`, [
      tokenHash,
    ])) as Array<Record<string, unknown>>;

    const row = rows[0];
    if (!row) return null;

    const repo = this.ds.getRepository(Invitation);
    return rowToEntity(repo, row);
  }

  async findByRawToken(rawToken: string): Promise<Invitation | null> {
    const tokenHash = await hashToken(rawToken);
    return this.findByTokenHash(tokenHash);
  }

  async isValid(rawToken: string): Promise<boolean> {
    const invitation = await this.findByRawToken(rawToken);
    if (!invitation) return false;
    if (invitation.expiresAt < new Date()) return false;
    // event_open_registration tokens are reusable (claimedAt stays null)
    if (invitation.purpose !== "event_open_registration" && invitation.claimedAt) return false;
    return true;
  }

  async claimForRegistration(rawToken: string, rsvpId: string): Promise<void> {
    const tokenHash = await hashToken(rawToken);
    await this.ds.query(
      `UPDATE invitations SET claimed_at = $1, rsvp_id = $2 WHERE token_hash = $3`,
      [new Date(), rsvpId, tokenHash],
    );
  }

  async claimForAccount(rawToken: string, userId: string): Promise<void> {
    const tokenHash = await hashToken(rawToken);
    await this.ds.query(
      `UPDATE invitations SET claimed_at = $1, created_user_id = $2 WHERE token_hash = $3`,
      [new Date(), userId, tokenHash],
    );
  }

  async findByEvent(eventId: string): Promise<InvitationOutput[]> {
    const rows = (await this.ds.query(
      `SELECT * FROM invitations WHERE event_id = $1 ORDER BY created_at DESC`,
      [eventId],
    )) as Array<Record<string, unknown>>;

    const repo = this.ds.getRepository(Invitation);
    return rows.map((row) => entityToOutput(rowToEntity(repo, row)));
  }

  async findUnclaimedByContact(contactId: string): Promise<InvitationOutput[]> {
    const rows = (await this.ds.query(
      `SELECT * FROM invitations WHERE contact_id = $1 AND claimed_at IS NULL ORDER BY created_at DESC`,
      [contactId],
    )) as Array<Record<string, unknown>>;

    const repo = this.ds.getRepository(Invitation);
    return rows.map((row) => entityToOutput(rowToEntity(repo, row)));
  }

  static hashToken = hashToken;
}
