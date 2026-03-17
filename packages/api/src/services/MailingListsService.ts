import type { DataSource } from "typeorm";
import type { DbLike } from "../db/dbAdapter";
import type {
  MailingList,
  MailingListMember,
  MailingListCriteria,
  ListPreview,
  MailingListStats,
  MailingListIncludedPage,
} from "@satyrsmc/shared/dto/admin/mailingList";
import type { ContactsService } from "./ContactsService";
import {
  Contact as ContactEntity,
  MailingList as MailingListEntity,
  MailingListMember as MailingListMemberEntity,
  ContactAddress as ContactAddressEntity,
} from "../entities";
import { uuid } from "./utils";
import { toISOString } from "../lib/date";

export class MailingListsService {
  constructor(
    private db: DbLike,
    private ds: DataSource,
    private contactsService: ContactsService,
  ) {}

  private async evaluateDynamicCriteria(criteria: MailingListCriteria | null): Promise<string[]> {
    if (!criteria) return [];

    /* Original: Dynamic SELECT id FROM contacts WHERE deleted_at IS NULL AND status = 'active' ... */
    const qb = this.ds
      .getRepository(ContactEntity)
      .createQueryBuilder("c")
      .select("c.id")
      .where("c.deletedAt IS NULL")
      .andWhere("c.status = :status", {
        status: criteria.active === false ? "inactive" : "active",
      });

    if (criteria.okToMail === true) {
      qb.andWhere("(c.okToMail = 'yes' OR c.okToMail = 'unknown') AND c.doNotContact = false");
    }
    if (criteria.okToEmail === true) {
      qb.andWhere("(c.okToEmail = 'yes' OR c.okToEmail = 'unknown') AND c.doNotContact = false");
    }
    if (criteria.hasPostalAddress === true) {
      qb.andWhere(
        "EXISTS (SELECT 1 FROM contact_addresses ca WHERE ca.contact_id = c.id AND ca.address_line1 IS NOT NULL AND ca.address_line1 != '')",
      );
    }
    if (criteria.hasEmail === true) {
      qb.andWhere("EXISTS (SELECT 1 FROM contact_emails ce WHERE ce.contact_id = c.id)");
    }
    if (criteria.organization) {
      qb.andWhere("c.organizationName ILIKE :org", { org: `%${criteria.organization}%` });
    }
    if (criteria.clubName) {
      qb.andWhere("c.clubName ILIKE :club", { club: `%${criteria.clubName}%` });
    }
    if (Array.isArray(criteria.tagIn) && criteria.tagIn.length > 0) {
      qb.andWhere(
        "c.id IN (SELECT contact_id FROM contact_tags WHERE tag_id IN (SELECT id FROM tags WHERE name IN (:...tagIn)))",
        { tagIn: criteria.tagIn },
      );
    }
    if (Array.isArray(criteria.tagNotIn) && criteria.tagNotIn.length > 0) {
      qb.andWhere(
        "c.id NOT IN (SELECT contact_id FROM contact_tags WHERE tag_id IN (SELECT id FROM tags WHERE name IN (:...tagNotIn)))",
        { tagNotIn: criteria.tagNotIn },
      );
    }
    if (criteria.hellenic === true) {
      qb.andWhere("c.hellenic = true");
    }
    qb.andWhere("(c.deceased IS NULL OR c.deceased = false)");

    const rows = await qb.getMany();
    return rows.map((r) => r.id);
  }

  async list(): Promise<MailingList[]> {
    /* Original: SELECT ml.*, e.name as event_name, (SELECT COUNT(*) FROM mailing_list_members ...) as manual_count FROM mailing_lists ml LEFT JOIN events e ... */
    const rows = await this.ds
      .getRepository(MailingListEntity)
      .createQueryBuilder("ml")
      .leftJoin("events", "e", "e.id = ml.event_id")
      .addSelect("e.name", "event_name")
      .addSelect(
        "(SELECT COUNT(*) FROM mailing_list_members mlm WHERE mlm.list_id = ml.id AND mlm.suppressed = false AND mlm.unsubscribed = false)",
        "manual_count",
      )
      .orderBy("ml.name")
      .getRawMany();

    return rows.map((r) => ({
      id: r.ml_id,
      name: r.ml_name,
      description: r.ml_description ?? null,
      list_type: (r.ml_list_type as MailingList["list_type"]) ?? "static",
      delivery_type: (r.ml_delivery_type as MailingList["delivery_type"]) ?? "both",
      event_id: r.ml_event_id ?? null,
      template: r.ml_template ?? null,
      criteria: r.ml_criteria ? (JSON.parse(r.ml_criteria) as MailingListCriteria) : null,
      created_at: toISOString(r.ml_created_at),
      updated_at: toISOString(r.ml_updated_at),
      event: r.ml_event_id ? { id: r.ml_event_id, name: r.event_name } : undefined,
      member_count: Number(r.manual_count ?? 0),
    }));
  }

  async get(id: string): Promise<MailingList | null> {
    /* Original: SELECT ml.*, e.name as event_name FROM mailing_lists ml LEFT JOIN events e ON e.id = ml.event_id WHERE ml.id = ? */
    const row = await this.ds
      .getRepository(MailingListEntity)
      .createQueryBuilder("ml")
      .leftJoin("events", "e", "e.id = ml.event_id")
      .addSelect([
        "ml.id",
        "ml.name",
        "ml.description",
        "ml.listType",
        "ml.deliveryType",
        "ml.eventId",
        "ml.template",
        "ml.criteria",
        "ml.createdAt",
        "ml.updatedAt",
      ])
      .addSelect("e.name", "event_name")
      .where("ml.id = :id", { id })
      .getRawOne();
    if (!row) return null;

    /* Original: SELECT COUNT(*) as c FROM mailing_list_members WHERE list_id = ? AND suppressed = 0 AND unsubscribed = 0 */
    const memberCount = await this.ds.getRepository(MailingListMemberEntity).count({
      where: { listId: id, suppressed: false, unsubscribed: false },
    });
    return {
      id: row.ml_id,
      name: row.ml_name,
      description: row.ml_description ?? null,
      list_type: (row.ml_list_type as MailingList["list_type"]) ?? "static",
      delivery_type: (row.ml_delivery_type as MailingList["delivery_type"]) ?? "both",
      event_id: row.ml_event_id ?? null,
      template: row.ml_template ?? null,
      criteria: row.ml_criteria ? (JSON.parse(row.ml_criteria) as MailingListCriteria) : null,
      created_at: toISOString(row.ml_created_at),
      updated_at: toISOString(row.ml_updated_at),
      event: row.ml_event_id ? { id: row.ml_event_id, name: row.event_name } : undefined,
      member_count: memberCount,
    };
  }

  async create(body: {
    name: string;
    description?: string;
    list_type?: MailingList["list_type"];
    delivery_type?: MailingList["delivery_type"];
    event_id?: string | null;
    template?: string | null;
    criteria?: MailingListCriteria | null;
  }) {
    const id = uuid();
    await this.db.run(
      "INSERT INTO mailing_lists (id, name, description, list_type, delivery_type, event_id, template, criteria) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        id,
        body.name,
        body.description ?? null,
        body.list_type ?? "static",
        body.delivery_type ?? "both",
        body.event_id ?? null,
        body.template ?? null,
        body.criteria ? JSON.stringify(body.criteria) : null,
      ],
    );
    return this.get(id)!;
  }

  async update(
    id: string,
    body: Partial<{
      name: string;
      description: string;
      list_type: MailingList["list_type"];
      delivery_type: MailingList["delivery_type"];
      event_id: string | null;
      template: string | null;
      criteria: MailingListCriteria | null;
    }>,
  ) {
    /* Original: SELECT * FROM mailing_lists WHERE id = ? */
    const existing = await this.ds.getRepository(MailingListEntity).findOne({ where: { id } });
    if (!existing) return null;

    const name = body.name ?? existing.name;
    const description = body.description !== undefined ? body.description : existing.description;
    const list_type = (body.list_type ?? existing.listType) as MailingList["list_type"];
    const delivery_type = (body.delivery_type ??
      existing.deliveryType) as MailingList["delivery_type"];
    const event_id = body.event_id !== undefined ? body.event_id : existing.eventId;
    const template = body.template !== undefined ? body.template : existing.template;
    const criteria =
      body.criteria !== undefined
        ? body.criteria
        : existing.criteria
          ? JSON.parse(existing.criteria)
          : null;

    await this.db.run(
      "UPDATE mailing_lists SET name = ?, description = ?, list_type = ?, delivery_type = ?, event_id = ?, template = ?, criteria = ?, updated_at = ? WHERE id = ?",
      [
        name,
        description,
        list_type,
        delivery_type,
        event_id,
        template,
        criteria ? JSON.stringify(criteria) : null,
        new Date().toISOString(),
        id,
      ],
    );
    return this.get(id)!;
  }

  async delete(id: string) {
    await this.db.run("DELETE FROM mailing_list_members WHERE list_id = ?", [id]);
    await this.db.run("DELETE FROM mailing_lists WHERE id = ?", [id]);
    return { ok: true };
  }

  async addMember(
    listId: string,
    contactId: string,
    source: "manual" | "import" | "rule" = "manual",
  ) {
    const id = uuid();
    try {
      await this.db.run(
        "INSERT INTO mailing_list_members (id, list_id, contact_id, source) VALUES (?, ?, ?, ?)",
        [id, listId, contactId, source],
      );
    } catch {
      return null;
    }
    return this.get(listId)!;
  }

  async removeMember(listId: string, contactId: string) {
    await this.db.run("DELETE FROM mailing_list_members WHERE list_id = ? AND contact_id = ?", [
      listId,
      contactId,
    ]);
    return { ok: true };
  }

  async removeExclusion(listId: string, contactId: string) {
    const result = await this.ds
      .getRepository(MailingListMemberEntity)
      .update(
        { listId, contactId },
        { suppressed: false, suppressReason: null, unsubscribed: false },
      );
    if (!result.affected) return null;
    return { ok: true };
  }

  async addMembersBulk(
    listId: string,
    contactIds: string[],
    source: "manual" | "import" | "rule" = "manual",
  ) {
    for (const contactId of contactIds) {
      try {
        await this.db.run(
          "INSERT INTO mailing_list_members (id, list_id, contact_id, source) VALUES (?, ?, ?, ?)",
          [uuid(), listId, contactId, source],
        );
      } catch {
        // duplicate, skip
      }
    }
    return { ok: true };
  }

  async addAllContacts(listId: string, source: "manual" | "import" | "rule" = "manual") {
    const qb = this.ds
      .getRepository(ContactEntity)
      .createQueryBuilder("c")
      .select("c.id")
      .where("c.deletedAt IS NULL")
      .andWhere("c.status = :status", { status: "active" })
      .andWhere("(c.deceased IS NULL OR c.deceased = false)");
    const rows = await qb.getMany();
    const contactIds = rows.map((r) => r.id);
    await this.addMembersBulk(listId, contactIds, source);
    return { ok: true, added: contactIds.length };
  }

  async addAllHellenics(listId: string, source: "manual" | "import" | "rule" = "manual") {
    const qb = this.ds
      .getRepository(ContactEntity)
      .createQueryBuilder("c")
      .select("c.id")
      .where("c.deletedAt IS NULL")
      .andWhere("c.status = :status", { status: "active" })
      .andWhere("(c.deceased IS NULL OR c.deceased = false)")
      .andWhere("c.hellenic = true");
    const rows = await qb.getMany();
    const contactIds = rows.map((r) => r.id);
    await this.addMembersBulk(listId, contactIds, source);
    return { ok: true, added: contactIds.length };
  }

  async preview(id: string): Promise<ListPreview> {
    const list = await this.get(id);
    if (!list) return { included: [], excluded: [], totalIncluded: 0, totalExcluded: 0 };

    let contactIds: string[];

    if (list.list_type === "static") {
      /* Original: SELECT contact_id FROM mailing_list_members WHERE list_id = ? AND suppressed = 0 AND unsubscribed = 0 */
      const rows = await this.ds.getRepository(MailingListMemberEntity).find({
        where: { listId: id, suppressed: false, unsubscribed: false },
        select: ["contactId"],
      });
      contactIds = rows.map((r) => r.contactId);
    } else if (list.list_type === "dynamic") {
      contactIds = await this.evaluateDynamicCriteria(
        (list.criteria ?? null) as MailingListCriteria,
      );
    } else {
      /* Original: SELECT contact_id FROM mailing_list_members WHERE list_id = ? AND suppressed = 0 AND unsubscribed = 0 */
      const manualRows = await this.ds.getRepository(MailingListMemberEntity).find({
        where: { listId: id, suppressed: false, unsubscribed: false },
        select: ["contactId"],
      });
      const manualIds = new Set(manualRows.map((r) => r.contactId));
      const dynamicIds = await this.evaluateDynamicCriteria(
        (list.criteria ?? null) as MailingListCriteria,
      );
      contactIds = [...new Set([...manualIds, ...dynamicIds])];
    }

    const included: ListPreview["included"] = [];
    const excluded: ListPreview["excluded"] = [];

    for (const cid of contactIds) {
      const contact = await this.contactsService.get(cid);
      if (!contact) continue;

      /* Check membership - needed for canRemoveFromList on excluded items */
      const memberRow = await this.ds.getRepository(MailingListMemberEntity).findOne({
        where: { listId: id, contactId: cid },
        select: ["suppressed", "suppressReason", "unsubscribed"],
      });
      const hasMembership = !!memberRow;

      if (contact.deceased) {
        excluded.push({ contact, reason: "Deceased", canRemoveFromList: hasMembership });
        continue;
      }
      if (contact.do_not_contact) {
        excluded.push({ contact, reason: "Do not contact", canRemoveFromList: hasMembership });
        continue;
      }
      if (contact.status === "inactive" || contact.status === "deleted") {
        excluded.push({ contact, reason: "Inactive or deleted", canRemoveFromList: hasMembership });
        continue;
      }

      /* Exclude if consent is false for the list's delivery type. Unknown = include. */
      const dt = list.delivery_type ?? "both";
      if (dt === "physical" || dt === "both") {
        if (contact.ok_to_mail === "no") {
          excluded.push({
            contact,
            reason: "No consent for physical mail",
            canRemoveFromList: hasMembership,
          });
          continue;
        }
      }
      if (dt === "email" || dt === "both") {
        if (contact.ok_to_email === "no") {
          excluded.push({
            contact,
            reason: "No consent for email",
            canRemoveFromList: hasMembership,
          });
          continue;
        }
      }

      if (memberRow?.suppressed) {
        excluded.push({
          contact,
          reason: memberRow.suppressReason ?? "Suppressed",
          removable: true,
          canRemoveFromList: true,
        });
        continue;
      }
      if (memberRow?.unsubscribed) {
        excluded.push({
          contact,
          reason: "Unsubscribed",
          removable: true,
          canRemoveFromList: true,
        });
        continue;
      }

      included.push({ contact });
    }

    /* For static lists, include suppressed/unsubscribed members in excluded (they're not in contactIds) */
    if (list.list_type === "static") {
      const suppressedRows = await this.ds.getRepository(MailingListMemberEntity).find({
        where: [
          { listId: id, suppressed: true },
          { listId: id, unsubscribed: true },
        ],
        select: ["contactId", "suppressed", "suppressReason", "unsubscribed"],
      });
      const seenExcluded = new Set(
        (excluded as Array<{ contact: { id: string } }>).map((e) => e.contact.id),
      );
      for (const r of suppressedRows) {
        if (seenExcluded.has(r.contactId)) continue;
        const contact = await this.contactsService.get(r.contactId);
        if (!contact) continue;
        seenExcluded.add(r.contactId);
        if (r.suppressed) {
          excluded.push({
            contact,
            reason: r.suppressReason ?? "Suppressed",
            removable: true,
            canRemoveFromList: true,
          });
        } else if (r.unsubscribed) {
          excluded.push({
            contact,
            reason: "Unsubscribed",
            removable: true,
            canRemoveFromList: true,
          });
        }
      }
    }

    return {
      included,
      excluded,
      totalIncluded: included.length,
      totalExcluded: excluded.length,
    };
  }

  async getMembers(listId: string): Promise<MailingListMember[]> {
    /* Original: SELECT * FROM mailing_list_members WHERE list_id = ? ORDER BY added_at DESC */
    const rows = await this.ds.getRepository(MailingListMemberEntity).find({
      where: { listId },
      order: { addedAt: "DESC" },
    });

    const result: MailingListMember[] = [];
    for (const r of rows) {
      const contact = await this.contactsService.get(r.contactId);
      if (contact) {
        result.push({
          id: r.id,
          list_id: r.listId,
          contact_id: r.contactId,
          added_by: r.addedBy ?? null,
          added_at: toISOString(r.addedAt) ?? "",
          source: (r.source as MailingListMember["source"]) ?? "manual",
          suppressed: r.suppressed,
          suppress_reason: r.suppressReason ?? null,
          unsubscribed: r.unsubscribed,
          contact,
        });
      }
    }
    return result;
  }

  /** Returns included contact IDs and whether each has manual membership (can be removed). */
  private async getIncludedContactIds(
    listId: string,
  ): Promise<{ contactIds: string[]; membershipMap: Map<string, boolean> }> {
    const list = await this.get(listId);
    if (!list) return { contactIds: [], membershipMap: new Map() };

    let contactIds: string[];
    if (list.list_type === "static") {
      const rows = await this.ds.getRepository(MailingListMemberEntity).find({
        where: { listId, suppressed: false, unsubscribed: false },
        select: ["contactId"],
      });
      contactIds = rows.map((r) => r.contactId);
    } else if (list.list_type === "dynamic") {
      contactIds = await this.evaluateDynamicCriteria(
        (list.criteria ?? null) as MailingListCriteria,
      );
    } else {
      const manualRows = await this.ds.getRepository(MailingListMemberEntity).find({
        where: { listId, suppressed: false, unsubscribed: false },
        select: ["contactId"],
      });
      const manualIds = new Set(manualRows.map((r) => r.contactId));
      const dynamicIds = await this.evaluateDynamicCriteria(
        (list.criteria ?? null) as MailingListCriteria,
      );
      contactIds = [...new Set([...manualIds, ...dynamicIds])];
    }

    const membershipMap = new Map<string, boolean>();
    const memberRows = await this.ds.getRepository(MailingListMemberEntity).find({
      where: { listId },
      select: ["contactId"],
    });
    for (const r of memberRows) {
      membershipMap.set(r.contactId, true);
    }

    const included: string[] = [];
    for (const cid of contactIds) {
      const contact = await this.contactsService.get(cid);
      if (!contact) continue;
      const memberRow = await this.ds.getRepository(MailingListMemberEntity).findOne({
        where: { listId, contactId: cid },
        select: ["suppressed", "suppressReason", "unsubscribed"],
      });
      const _hasMembership = !!memberRow;

      if (contact.deceased) continue;
      if (contact.do_not_contact) continue;
      if (contact.status === "inactive" || contact.status === "deleted") continue;
      const dt = list.delivery_type ?? "both";
      if (dt === "physical" || dt === "both") {
        if (contact.ok_to_mail === "no") continue;
      }
      if (dt === "email" || dt === "both") {
        if (contact.ok_to_email === "no") continue;
      }
      if (memberRow?.suppressed || memberRow?.unsubscribed) continue;

      included.push(cid);
    }

    return { contactIds: included, membershipMap };
  }

  async getStats(listId: string): Promise<MailingListStats> {
    const list = await this.get(listId);
    const stats: MailingListStats = {
      duplicateAddresses: {
        totalDuplicateContacts: 0,
        uniqueAddressesWithDuplicates: 0,
        groups: [],
      },
    };

    if (!list) return stats;

    const { contactIds } = await this.getIncludedContactIds(listId);
    if (contactIds.length === 0) return stats;

    const dt = list.delivery_type ?? "both";
    const isPhysical = dt === "physical" || dt === "both";

    const addrRepo = this.ds.getRepository(ContactAddressEntity);
    const addresses = await addrRepo
      .createQueryBuilder("ca")
      .select([
        "ca.contactId",
        "ca.addressLine1",
        "ca.addressLine2",
        "ca.city",
        "ca.state",
        "ca.postalCode",
        "ca.country",
      ])
      .where("ca.contactId IN (:...ids)", { ids: contactIds })
      .orderBy("ca.isPrimaryMailing", "DESC")
      .addOrderBy("ca.id", "ASC")
      .getMany();

    const contactToAddr = new Map<
      string,
      { line1: string; line2: string; city: string; state: string; postal: string; country: string }
    >();
    for (const a of addresses) {
      if (!contactToAddr.has(a.contactId)) {
        contactToAddr.set(a.contactId, {
          line1: (a.addressLine1 ?? "").trim(),
          line2: (a.addressLine2 ?? "").trim(),
          city: (a.city ?? "").trim(),
          state: (a.state ?? "").trim(),
          postal: (a.postalCode ?? "").trim(),
          country: (a.country ?? "US").trim(),
        });
      }
    }

    const normalizeAddr = (addr: {
      line1: string;
      line2: string;
      city: string;
      state: string;
      postal: string;
      country: string;
    }) =>
      [addr.line1, addr.line2, addr.city, addr.state, addr.postal, addr.country]
        .map((s) => (s ?? "").toLowerCase().replace(/\s+/g, " "))
        .join("|");

    if (isPhysical) {
      const byState = new Map<string, number>();
      const byCountry = new Map<string, number>();
      for (const cid of contactIds) {
        const addr = contactToAddr.get(cid);
        if (!addr || (!addr.line1 && !addr.city)) continue;
        const state = addr.state || "(unknown)";
        const country = addr.country || "US";
        byState.set(state, (byState.get(state) ?? 0) + 1);
        byCountry.set(country, (byCountry.get(country) ?? 0) + 1);
      }
      stats.geographic = {
        byState: Array.from(byState.entries())
          .map(([state, count]) => ({ state, count }))
          .sort((a, b) => b.count - a.count),
        byCountry: Array.from(byCountry.entries())
          .map(([country, count]) => ({ country, count }))
          .sort((a, b) => b.count - a.count),
      };
    }

    const addrToContacts = new Map<string, string[]>();
    for (const cid of contactIds) {
      const addr = contactToAddr.get(cid);
      if (!addr || (!addr.line1 && !addr.city)) continue;
      const key = normalizeAddr(addr);
      if (!addrToContacts.has(key)) addrToContacts.set(key, []);
      addrToContacts.get(key)!.push(cid);
    }

    const duplicateGroups = Array.from(addrToContacts.entries()).filter(
      ([, ids]) => ids.length > 1,
    );
    let totalDuplicateContacts = 0;
    const groups: Array<{
      address: string;
      contactIds: string[];
      contacts: Array<{ id: string; display_name: string }>;
    }> = [];
    for (const [, ids] of duplicateGroups) {
      totalDuplicateContacts += ids.length;
      const addr = contactToAddr.get(ids[0]!);
      const addressStr = addr
        ? [addr.line1, addr.line2, addr.city, addr.state, addr.postal, addr.country]
            .filter(Boolean)
            .join(", ")
        : "";
      const contacts: Array<{ id: string; display_name: string }> = [];
      for (const id of ids) {
        const c = await this.contactsService.get(id);
        if (c) contacts.push({ id: c.id, display_name: c.display_name });
      }
      groups.push({ address: addressStr, contactIds: ids, contacts });
    }
    stats.duplicateAddresses = {
      totalDuplicateContacts,
      uniqueAddressesWithDuplicates: duplicateGroups.length,
      groups,
    };

    return stats;
  }

  async getIncludedPaginated(
    listId: string,
    page: number,
    limit: number,
    search?: string,
  ): Promise<MailingListIncludedPage> {
    const { contactIds, membershipMap } = await this.getIncludedContactIds(listId);

    let filteredIds = contactIds;
    if (search && search.trim() && contactIds.length > 0) {
      const q = `%${search.trim()}%`;
      const qb = this.ds
        .getRepository(ContactEntity)
        .createQueryBuilder("c")
        .select("c.id")
        .where("c.id IN (:...ids)", { ids: contactIds })
        .andWhere(
          "(c.displayName ILIKE :q OR c.organizationName ILIKE :q OR c.firstName ILIKE :q OR c.lastName ILIKE :q OR EXISTS (SELECT 1 FROM contact_emails ce WHERE ce.contact_id = c.id AND ce.email ILIKE :q))",
          { q },
        );
      const rows = await qb.getMany();
      filteredIds = rows.map((r) => r.id);
    }

    const total = filteredIds.length;
    const offset = (page - 1) * limit;
    const pageIds = filteredIds.slice(offset, offset + limit);

    const contacts: MailingListIncludedPage["contacts"] = [];
    for (const cid of pageIds) {
      const contact = await this.contactsService.get(cid);
      if (contact) {
        contacts.push({ contact, canRemoveFromList: membershipMap.get(cid) ?? false });
      }
    }

    return { contacts, total, page, limit };
  }

  /**
   * Returns mailing lists that a contact belongs to, with their unsubscribed status.
   * Used by members to see and manage their own mailing list subscriptions.
   */
  async getSubscriptionsForContact(
    contactId: string,
  ): Promise<
    Array<{ list_id: string; name: string; description: string | null; unsubscribed: boolean }>
  > {
    const rows = await this.ds
      .getRepository(MailingListMemberEntity)
      .createQueryBuilder("mlm")
      .innerJoin(MailingListEntity, "ml", "ml.id = mlm.list_id")
      .select([
        "mlm.list_id AS list_id",
        "ml.name AS name",
        "ml.description AS description",
        "mlm.unsubscribed AS unsubscribed",
      ])
      .where("mlm.contact_id = :contactId", { contactId })
      .andWhere("mlm.suppressed = false")
      .orderBy("ml.name", "ASC")
      .getRawMany();

    return rows.map((r) => ({
      list_id: r.list_id,
      name: r.name,
      description: r.description ?? null,
      unsubscribed: r.unsubscribed ?? false,
    }));
  }

  /**
   * Toggles a contact's unsubscribed flag on a specific mailing list.
   * Only works if the contact has a membership record and is not suppressed.
   */
  async setUnsubscribed(
    contactId: string,
    listId: string,
    unsubscribed: boolean,
  ): Promise<{ success: boolean }> {
    const repo = this.ds.getRepository(MailingListMemberEntity);
    const member = await repo.findOne({ where: { contactId, listId } });

    if (!member || member.suppressed) {
      throw new Error("Mailing list membership not found");
    }

    member.unsubscribed = unsubscribed;
    await repo.save(member);

    return { success: true };
  }
}
