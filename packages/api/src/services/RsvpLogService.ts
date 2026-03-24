import type { DataSource } from "typeorm";
import type { RsvpLogCode } from "@satyrsmc/shared/lib/enums";
import type { RsvpLogOutput } from "@satyrsmc/shared/dto/admin/rsvp";
import { RsvpLog } from "../entities";
import { uuid } from "./utils";

function entityToOutput(e: RsvpLog): RsvpLogOutput {
  return {
    id: e.id,
    rsvpId: e.rsvpId,
    loggedBy: e.loggedBy,
    messageCode: e.messageCode,
    message: e.message,
    createdAt: e.createdAt.toISOString(),
  };
}

export class RsvpLogService {
  constructor(private ds: DataSource) {}

  async create(
    rsvpId: string,
    messageCode: RsvpLogCode,
    loggedBy: string | null,
    message?: string,
  ): Promise<RsvpLogOutput> {
    const id = uuid();
    const now = new Date();

    await this.ds.query(
      `INSERT INTO rsvp_logs (id, rsvp_id, logged_by, message_code, message, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, rsvpId, loggedBy, messageCode, message ?? null, now],
    );

    return {
      id,
      rsvpId,
      loggedBy,
      messageCode,
      message: message ?? null,
      createdAt: now.toISOString(),
    };
  }

  async listByRsvp(rsvpId: string): Promise<RsvpLogOutput[]> {
    const rows = (await this.ds.query(
      `SELECT * FROM rsvp_logs WHERE rsvp_id = $1 ORDER BY created_at ASC`,
      [rsvpId],
    )) as Array<Record<string, unknown>>;

    const repo = this.ds.getRepository(RsvpLog);
    return rows.map((row) => {
      const entity = repo.create({
        id: row.id as string,
        rsvpId: row.rsvp_id as string,
        loggedBy: (row.logged_by as string) ?? null,
        messageCode: row.message_code as RsvpLogCode,
        message: (row.message as string) ?? null,
        createdAt:
          row.created_at instanceof Date ? row.created_at : new Date(row.created_at as string),
      });
      return entityToOutput(entity);
    });
  }
}
