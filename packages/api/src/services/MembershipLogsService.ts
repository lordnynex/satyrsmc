import type { DataSource } from "typeorm";
import type { MembershipMessageCode } from "@satyrsmc/shared/lib/enums";
import type {
  MembershipLogListOutput,
  MembershipLogCreateInput,
  MembershipLogCreateOutput,
} from "@satyrsmc/shared/dto/admin/membershipLog";
import { MembershipLog } from "../entities";
import { uuid } from "./utils";

function entityToOutput(e: MembershipLog): MembershipLogCreateOutput {
  return {
    id: e.id,
    user_id: e.userId,
    logged_by: e.loggedBy,
    message_code: e.messageCode,
    message: e.message,
    created_at: e.createdAt.toISOString(),
  };
}

export class MembershipLogsService {
  constructor(private ds: DataSource) {}

  async list(input: {
    user_id: string;
    page?: number;
    per_page?: number;
  }): Promise<MembershipLogListOutput> {
    const { user_id, page = 1, per_page: perPage = 20 } = input;
    const offset = (page - 1) * perPage;

    const countResult = (await this.ds.query(
      `SELECT COUNT(*)::int AS total FROM membership_logs WHERE user_id = $1`,
      [user_id],
    )) as Array<{ total: number }>;
    const total = countResult[0]?.total ?? 0;

    const rows = (await this.ds.query(
      `SELECT * FROM membership_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [user_id, perPage, offset],
    )) as Array<Record<string, unknown>>;

    const repo = this.ds.getRepository(MembershipLog);
    const items = rows.map((row) => {
      const entity = repo.create({
        id: row.id as string,
        userId: row.user_id as string,
        loggedBy: (row.logged_by as string) ?? null,
        messageCode: row.message_code as MembershipMessageCode,
        message: (row.message as string) ?? null,
        createdAt:
          row.created_at instanceof Date ? row.created_at : new Date(row.created_at as string),
      });
      return entityToOutput(entity);
    });

    return { items, page, per_page: perPage, total };
  }

  async create(
    input: MembershipLogCreateInput,
    loggedBy: string | null,
  ): Promise<MembershipLogCreateOutput> {
    const id = uuid();
    const now = new Date();

    await this.ds.query(
      `INSERT INTO membership_logs (id, user_id, logged_by, message_code, message, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, input.user_id, loggedBy, input.message_code, input.message ?? null, now],
    );

    return {
      id,
      user_id: input.user_id,
      logged_by: loggedBy,
      message_code: input.message_code,
      message: input.message ?? null,
      created_at: now.toISOString(),
    };
  }
}
