import type { DataSource } from "typeorm";
import { ContactSubmission, ContactMemberSubmission } from "../entities";
import { uuid } from "./utils";
import { toISOString } from "../lib/date";

export class ContactSubmissionsService {
  constructor(private ds: DataSource) {}

  async createContact(body: { name: string; email: string; subject?: string | null; message: string }) {
    const id = uuid();
    const repo = this.ds.getRepository(ContactSubmission);
    const row = repo.create({
      id,
      name: body.name,
      email: body.email,
      subject: body.subject ?? null,
      message: body.message,
      status: "new",
      createdAt: new Date().toISOString(),
    });
    await repo.save(row);
    return { id, created: true };
  }

  async createContactMember(body: {
    member_id: string;
    sender_name: string;
    sender_email: string;
    message: string;
  }) {
    const id = uuid();
    const repo = this.ds.getRepository(ContactMemberSubmission);
    const row = repo.create({
      id,
      memberId: body.member_id,
      senderName: body.sender_name,
      senderEmail: body.sender_email,
      message: body.message,
      status: "new",
      createdAt: new Date().toISOString(),
    });
    await repo.save(row);
    return { id, created: true };
  }

  async listContactSubmissions() {
    const rows = await this.ds.getRepository(ContactSubmission).find({
      order: { createdAt: "DESC" },
    });
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      subject: r.subject ?? null,
      message: r.message,
      status: r.status,
      created_at: toISOString(r.createdAt),
    }));
  }

  async listContactMemberSubmissions() {
    const rows = await this.ds.getRepository(ContactMemberSubmission).find({
      order: { createdAt: "DESC" },
    });
    return rows.map((r) => ({
      id: r.id,
      member_id: r.memberId,
      sender_name: r.senderName,
      sender_email: r.senderEmail,
      message: r.message,
      status: r.status,
      created_at: toISOString(r.createdAt),
    }));
  }
}
