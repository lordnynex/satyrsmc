import type { DataSource } from "typeorm";
import type { DbLike } from "../db/dbAdapter";
import type { Contact, MailingList, MailingBatch, MailingBatchRecipient } from "@satyrsmc/shared/types/contact";
import type { MailingListsService } from "./MailingListsService";
import { MailingBatch as MailingBatchEntity, MailingBatchRecipient as MailingBatchRecipientEntity } from "../entities";
import { uuid } from "./utils";
import { toISOString } from "../lib/date";

export class MailingBatchesService {
  constructor(
    private db: DbLike,
    private ds: DataSource,
    private mailingListsService: MailingListsService
  ) {}

  async create(listId: string, name: string) {
    const preview = await this.mailingListsService.preview(listId);
    const list = await this.mailingListsService.get(listId);
    if (!list) return null;

    const id = uuid();
    const eventId = list.event_id;

    await this.db.run(
      "INSERT INTO mailing_batches (id, list_id, event_id, name, recipient_count) VALUES (?, ?, ?, ?, ?)",
      [id, listId, eventId, name, preview.totalIncluded]
    );

    const primaryAddress = (c: Contact) => {
      const addrs = c.addresses ?? [];
      const primary = addrs.find((a) => a.is_primary_mailing) ?? addrs[0];
      return primary;
    };

    for (const { contact } of preview.included) {
      const addr = primaryAddress(contact);
      const rid = uuid();
      await this.db.run(
        `INSERT INTO mailing_batch_recipients (id, batch_id, contact_id, snapshot_name, snapshot_address_line1, snapshot_address_line2, snapshot_city, snapshot_state, snapshot_postal_code, snapshot_country, snapshot_organization, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'queued')`,
        [
          rid,
          id,
          contact.id,
          contact.display_name,
          addr?.address_line1 ?? null,
          addr?.address_line2 ?? null,
          addr?.city ?? null,
          addr?.state ?? null,
          addr?.postal_code ?? null,
          addr?.country ?? null,
          contact.organization_name ?? null,
        ]
      );
    }

    return this.get(id)!;
  }

  async get(id: string): Promise<MailingBatch | null> {
    /* Original: SELECT mb.*, ml.name as list_name, e.name as event_name FROM mailing_batches mb LEFT JOIN mailing_lists ml ON ml.id = mb.list_id LEFT JOIN events e ON e.id = mb.event_id WHERE mb.id = ? */
    const row = await this.ds
      .getRepository(MailingBatchEntity)
      .createQueryBuilder("mb")
      .leftJoin("mailing_lists", "ml", "ml.id = mb.list_id")
      .leftJoin("events", "e", "e.id = mb.event_id")
      .addSelect("ml.name", "list_name")
      .addSelect("e.name", "event_name")
      .where("mb.id = :id", { id })
      .getRawOne();
    if (!row) return null;

    /* Original: SELECT * FROM mailing_batch_recipients WHERE batch_id = ? ORDER BY snapshot_name */
    const recipients = await this.ds.getRepository(MailingBatchRecipientEntity).find({
      where: { batchId: id },
      order: { snapshotName: "ASC" },
    });

    return {
      id: row.mb_id,
      list_id: row.mb_list_id,
      event_id: row.mb_event_id ?? null,
      name: row.mb_name,
      created_by: row.mb_created_by ?? null,
      created_at: toISOString(row.mb_created_at) ?? "",
      recipient_count: row.mb_recipient_count ?? 0,
      list: { id: row.mb_list_id, name: row.list_name } as MailingList,
      event: row.mb_event_id ? { id: row.mb_event_id, name: row.event_name } : undefined,
      recipients: recipients.map((r) => ({
        id: r.id,
        batch_id: r.batchId,
        contact_id: r.contactId,
        snapshot_name: r.snapshotName,
        snapshot_address_line1: r.snapshotAddressLine1,
        snapshot_address_line2: r.snapshotAddressLine2,
        snapshot_city: r.snapshotCity,
        snapshot_state: r.snapshotState,
        snapshot_postal_code: r.snapshotPostalCode,
        snapshot_country: r.snapshotCountry,
        snapshot_organization: r.snapshotOrganization,
        status: (r.status as MailingBatchRecipient["status"]) ?? "queued",
        invalid_reason: r.invalidReason,
        returned_reason: r.returnedReason,
      })),
    };
  }

  async list(): Promise<MailingBatch[]> {
    /* Original: SELECT mb.*, ml.name as list_name, e.name as event_name FROM mailing_batches mb LEFT JOIN mailing_lists ml ON ml.id = mb.list_id LEFT JOIN events e ON e.id = mb.event_id ORDER BY mb.created_at DESC */
    const rows = await this.ds
      .getRepository(MailingBatchEntity)
      .createQueryBuilder("mb")
      .leftJoin("mailing_lists", "ml", "ml.id = mb.list_id")
      .leftJoin("events", "e", "e.id = mb.event_id")
      .addSelect("ml.name", "list_name")
      .addSelect("e.name", "event_name")
      .orderBy("mb.created_at", "DESC")
      .getRawMany();

    return rows.map((r) => ({
      id: r.mb_id,
      list_id: r.mb_list_id,
      event_id: r.mb_event_id ?? null,
      name: r.mb_name,
      created_by: r.mb_created_by ?? null,
      created_at: toISOString(r.mb_created_at) ?? "",
      recipient_count: r.mb_recipient_count ?? 0,
      list: { id: r.mb_list_id, name: r.list_name } as MailingList,
      event: r.mb_event_id ? { id: r.mb_event_id, name: r.event_name } : undefined,
    }));
  }

  async updateRecipientStatus(
    batchId: string,
    recipientId: string,
    status: MailingBatchRecipient["status"],
    reason?: string
  ) {
    if (status === "returned") {
      await this.db.run(
        "UPDATE mailing_batch_recipients SET status = ?, returned_reason = ? WHERE id = ? AND batch_id = ?",
        [status, reason ?? null, recipientId, batchId]
      );
    } else if (status === "invalid") {
      await this.db.run(
        "UPDATE mailing_batch_recipients SET status = ?, invalid_reason = ? WHERE id = ? AND batch_id = ?",
        [status, reason ?? null, recipientId, batchId]
      );
    } else {
      await this.db.run(
        "UPDATE mailing_batch_recipients SET status = ? WHERE id = ? AND batch_id = ?",
        [status, recipientId, batchId]
      );
    }
    return { ok: true };
  }
}
