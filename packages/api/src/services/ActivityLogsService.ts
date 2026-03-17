import type { DataSource } from "typeorm";
import type { ActivityMessageCode } from "@satyrsmc/shared/lib/enums";
import type {
  ActivityLogListOutput,
  ActivityLogCreateInput,
  ActivityLogCreateOutput,
} from "@satyrsmc/shared/dto/admin/activityLog";
import { ActivityLog } from "../entities";
import { uuid } from "./utils";

function entityToOutput(e: ActivityLog): ActivityLogCreateOutput {
  return {
    id: e.id,
    user_id: e.userId,
    message_code: e.messageCode,
    reference_id: e.referenceId,
    reference_type: e.referenceType,
    created_at: e.createdAt.toISOString(),
  };
}

export class ActivityLogsService {
  constructor(private ds: DataSource) {}

  async list(input?: {
    user_id?: string;
    page?: number;
    per_page?: number;
  }): Promise<ActivityLogListOutput> {
    const page = input?.page ?? 1;
    const perPage = input?.per_page ?? 20;
    const offset = (page - 1) * perPage;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 0;

    if (input?.user_id) {
      idx++;
      conditions.push(`user_id = $${idx}`);
      params.push(input.user_id);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countResult = (await this.ds.query(
      `SELECT COUNT(*)::int AS total FROM activity_logs ${where}`,
      params,
    )) as Array<{ total: number }>;
    const total = countResult[0]?.total ?? 0;

    idx++;
    const limitIdx = idx;
    idx++;
    const offsetIdx = idx;

    const rows = (await this.ds.query(
      `SELECT * FROM activity_logs ${where} ORDER BY created_at DESC LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      [...params, perPage, offset],
    )) as Array<Record<string, unknown>>;

    const repo = this.ds.getRepository(ActivityLog);
    const items = rows.map((row) => {
      const entity = repo.create({
        id: row.id as string,
        userId: row.user_id as string,
        messageCode: row.message_code as ActivityMessageCode,
        referenceId: (row.reference_id as string) ?? null,
        referenceType: (row.reference_type as string) ?? null,
        createdAt:
          row.created_at instanceof Date ? row.created_at : new Date(row.created_at as string),
      });
      return entityToOutput(entity);
    });

    return { items, page, per_page: perPage, total };
  }

  async create(input: ActivityLogCreateInput): Promise<ActivityLogCreateOutput> {
    const id = uuid();
    const now = new Date();

    await this.ds.query(
      `INSERT INTO activity_logs (id, user_id, message_code, reference_id, reference_type, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        id,
        input.user_id,
        input.message_code,
        input.reference_id ?? null,
        input.reference_type ?? null,
        now,
      ],
    );

    return {
      id,
      user_id: input.user_id,
      message_code: input.message_code,
      reference_id: input.reference_id ?? null,
      reference_type: input.reference_type ?? null,
      created_at: now.toISOString(),
    };
  }
}
