import { In } from "typeorm";
import type { DataSource } from "typeorm";
import type { EventType, EventAssignmentCategory } from "@satyrsmc/shared/lib/enums";
import type { DbLike } from "../db/dbAdapter";
import {
  Event,
  EventPhoto,
  EventAttendee,
  EventRideMemberAttendee,
  EventAsset,
  RideScheduleItem,
  EventPlanningMilestone,
  EventMilestoneMember,
  EventPackingCategory,
  EventPackingItem,
  EventVolunteer,
  EventAssignment,
  EventAssignmentMember,
  Member,
  Contact,
  Incident,
} from "../entities";
import { uuid, memberRowToApi } from "./utils";
import { ImageService } from "./ImageService";
import { toISOString, toISOStringOrNull } from "../lib/date";
import type { IncidentListOutput } from "@satyrsmc/shared/dto/admin/incident";
import type {
  EventAddAssetOutput,
  EventAddPhotoOutput,
  EventCreateOutput,
  EventDeleteAssetOutput,
  EventDeleteOutput,
  EventDeletePhotoOutput,
  EventGetOutput,
  EventListOutput,
  EventUpdateOutput,
} from "@satyrsmc/shared/dto/admin/event";
import type { GetEventsFeedOutput } from "@satyrsmc/shared/dto/website";

function memberEntityToApi(m: Member) {
  return memberRowToApi({
    id: m.id,
    name: m.name,
    photo: m.photo,
    photo_thumbnail: m.photoThumbnail,
  } as Record<string, unknown>);
}

export class EventsService {
  constructor(
    private db: DbLike,
    private ds: DataSource
  ) {}

  async list(type?: string): Promise<EventListOutput> {
    /* Original: SELECT * FROM events ORDER BY year DESC, name */
    const repo = this.ds.getRepository(Event);
    const findOptions: Parameters<typeof repo.find>[0] = {
      order: { year: "DESC", name: "ASC" },
    };
    if (type) {
      findOptions.where = { eventType: type };
    }
    const entities = await repo.find(findOptions);
    return entities.map((e) => ({
      id: e.id,
      name: e.name,
      description: e.description ?? null,
      year: e.year ?? null,
      event_date: toISOStringOrNull(e.eventDate),
      event_url: e.eventUrl ?? null,
      event_location: e.eventLocation ?? null,
      event_location_embed: e.eventLocationEmbed ?? null,
      ga_ticket_cost: e.gaTicketCost ?? null,
      day_pass_cost: e.dayPassCost ?? null,
      ga_tickets_sold: e.gaTicketsSold ?? null,
      day_passes_sold: e.dayPassesSold ?? null,
      budget_id: e.budgetId ?? null,
      scenario_id: e.scenarioId ?? null,
      planning_notes: e.planningNotes ?? null,
      event_type: e.eventType ?? "badger",
      show_on_website: e.showOnWebsite,
      created_at: toISOString(e.createdAt),
    }));
  }

  async listForWebsite(): Promise<GetEventsFeedOutput> {
    const repo = this.ds.getRepository(Event);
    const entities = await repo.find({
      where: { showOnWebsite: true },
      order: { year: "DESC", name: "ASC" },
    });
    return entities.map((e) => ({
      id: e.id,
      name: e.name,
      description: e.description ?? null,
      year: e.year ?? null,
      event_date: toISOStringOrNull(e.eventDate),
      event_url: e.eventUrl ?? null,
      event_location: e.eventLocation ?? null,
      event_location_embed: e.eventLocationEmbed ?? null,
      ga_ticket_cost: e.gaTicketCost ?? null,
      day_pass_cost: e.dayPassCost ?? null,
      ga_tickets_sold: e.gaTicketsSold ?? null,
      day_passes_sold: e.dayPassesSold ?? null,
      budget_id: e.budgetId ?? null,
      scenario_id: e.scenarioId ?? null,
      planning_notes: e.planningNotes ?? null,
      event_type: e.eventType ?? "badger",
      created_at: toISOString(e.createdAt) ?? "",
    }));
  }

  async get(id: string): Promise<EventGetOutput | null> {
    /* Original: SELECT * FROM events WHERE id = ? */
    const event = await this.ds.getRepository(Event).findOne({ where: { id } });
    if (!event) return null;
    const e = event;
    /* Original: SELECT * FROM event_planning_milestones WHERE event_id = ? ORDER BY year, month, sort_order */
    const milestones = await this.ds.getRepository(EventPlanningMilestone).find({
      where: { eventId: id },
      order: { year: "ASC", month: "ASC", sortOrder: "ASC" },
    });
    /* Original: SELECT emm.* FROM event_milestone_members emm WHERE emm.milestone_id IN (...) ORDER BY emm.milestone_id, emm.sort_order */
    const milestoneMembers = milestones.length
      ? await this.ds.getRepository(EventMilestoneMember).find({
          where: { milestoneId: In(milestones.map((m) => m.id)) },
          order: { milestoneId: "ASC", sortOrder: "ASC" },
        })
      : [];
    const milestoneMemberIds = [...new Set(milestoneMembers.map((mm) => mm.memberId))];
    const memberRepo = this.ds.getRepository(Member);
    const milestoneMembersMap = new Map<string, { id: string; name: string; photo_url: string | null; photo_thumbnail_url: string | null }>();
    for (const mid of milestoneMemberIds) {
      const m = await memberRepo.findOne({ where: { id: mid }, select: ["id", "name", "photo", "photoThumbnail"] });
      if (m) milestoneMembersMap.set(mid, memberEntityToApi(m));
    }
    const membersByMilestone = new Map<string, EventMilestoneMember[]>();
    for (const mm of milestoneMembers) {
      const list = membersByMilestone.get(mm.milestoneId) ?? [];
      list.push(mm);
      membersByMilestone.set(mm.milestoneId, list);
    }
    /* Original: SELECT * FROM event_packing_categories WHERE event_id = ? ORDER BY sort_order, name */
    const packingCategories = await this.ds.getRepository(EventPackingCategory).find({
      where: { eventId: id },
      order: { sortOrder: "ASC", name: "ASC" },
    });
    /* Original: SELECT * FROM event_packing_items WHERE event_id = ? ORDER BY category_id, sort_order, name */
    const packing = await this.ds.getRepository(EventPackingItem).find({
      where: { eventId: id },
      order: { categoryId: "ASC", sortOrder: "ASC", name: "ASC" },
    });
    /* Original: SELECT * FROM event_volunteers WHERE event_id = ? ORDER BY department, sort_order, name */
    const volunteers = await this.ds.getRepository(EventVolunteer).find({
      where: { eventId: id },
      order: { department: "ASC", sortOrder: "ASC", name: "ASC" },
    });
    /* Original: SELECT * FROM event_assignments WHERE event_id = ? ORDER BY category, sort_order, name */
    const assignments = await this.ds.getRepository(EventAssignment).find({
      where: { eventId: id },
      order: { category: "ASC", sortOrder: "ASC", name: "ASC" },
    });
    /* Original: SELECT eam.* FROM event_assignment_members eam WHERE eam.assignment_id IN (...) ORDER BY eam.assignment_id, eam.sort_order */
    const assignmentMembers = assignments.length
      ? await this.ds.getRepository(EventAssignmentMember).find({
          where: { assignmentId: In(assignments.map((a) => a.id)) },
          order: { assignmentId: "ASC", sortOrder: "ASC" },
        })
      : [];
    const memberIds = [...new Set(assignmentMembers.map((am) => am.memberId))];
    const membersMap = new Map<string, { id: string; name: string; photo_url: string | null; photo_thumbnail_url: string | null }>();
    for (const mid of memberIds) {
      const m = await memberRepo.findOne({ where: { id: mid }, select: ["id", "name", "photo", "photoThumbnail"] });
      if (m) membersMap.set(mid, memberEntityToApi(m));
    }
    const membersByAssignment = new Map<string, EventAssignmentMember[]>();
    for (const am of assignmentMembers) {
      const list = membersByAssignment.get(am.assignmentId) ?? [];
      list.push(am);
      membersByAssignment.set(am.assignmentId, list);
    }
    const eventPhotos = await this.ds.getRepository(EventPhoto).find({
      where: { eventId: id },
      order: { sortOrder: "ASC", createdAt: "ASC" },
    });
    const incidents = await this.getIncidents(id);
    return {
      id: e.id,
      name: e.name,
      description: e.description ?? null,
      year: e.year ?? null,
      event_date: toISOStringOrNull(e.eventDate),
      event_url: e.eventUrl ?? null,
      event_location: e.eventLocation ?? null,
      event_location_embed: e.eventLocationEmbed ?? null,
      ga_ticket_cost: e.gaTicketCost ?? null,
      day_pass_cost: e.dayPassCost ?? null,
      ga_tickets_sold: e.gaTicketsSold ?? null,
      day_passes_sold: e.dayPassesSold ?? null,
      budget_id: e.budgetId ?? null,
      scenario_id: e.scenarioId ?? null,
      planning_notes: e.planningNotes ?? null,
      event_type: (e.eventType ?? "badger") as EventType,
      show_on_website: e.showOnWebsite,
      created_at: toISOString(e.createdAt),
      milestones: milestones.map((m) => {
        const month = m.month;
        const year = m.year;
        const lastDay = new Date(year, month, 0);
        const defaultDueDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay.getDate()).padStart(2, "0")}`;
        const mmList = membersByMilestone.get(m.id) ?? [];
        return {
          id: m.id,
          event_id: m.eventId,
          month,
          year,
          description: m.description,
          sort_order: m.sortOrder ?? 0,
          completed: m.completed,
          due_date: toISOString(m.dueDate) ?? defaultDueDate,
          members: mmList.map((mm) => ({
            id: mm.id,
            milestone_id: mm.milestoneId,
            member_id: mm.memberId,
            sort_order: mm.sortOrder ?? 0,
            member: milestoneMembersMap.get(mm.memberId),
          })),
        };
      }),
      packingCategories: packingCategories.map((c) => ({
        id: c.id,
        event_id: c.eventId,
        name: c.name,
        sort_order: c.sortOrder ?? 0,
      })),
      packingItems: packing.map((p) => ({
        id: p.id,
        event_id: p.eventId,
        category_id: p.categoryId,
        name: p.name,
        sort_order: p.sortOrder ?? 0,
        quantity: p.quantity ?? null,
        note: p.note ?? null,
        loaded: p.loaded,
      })),
      volunteers: volunteers.map((v) => ({
        id: v.id,
        event_id: v.eventId,
        name: v.name,
        department: v.department,
        sort_order: v.sortOrder ?? 0,
      })),
      assignments: assignments.map((a) => {
        const amList = membersByAssignment.get(a.id) ?? [];
        return {
          id: a.id,
          event_id: a.eventId,
          name: a.name,
          category: a.category,
          sort_order: a.sortOrder ?? 0,
          members: amList.map((am) => ({
            id: am.id,
            assignment_id: am.assignmentId,
            member_id: am.memberId,
            sort_order: am.sortOrder ?? 0,
            member: membersMap.get(am.memberId),
          })),
        };
      }),
      event_photos: eventPhotos.map((p) => ({
        id: p.id,
        event_id: p.eventId,
        sort_order: p.sortOrder ?? 0,
        photo_url: `/api/events/${id}/photos/${p.id}?size=full`,
        photo_thumbnail_url: `/api/events/${id}/photos/${p.id}?size=thumbnail`,
        photo_display_url: `/api/events/${id}/photos/${p.id}?size=display`,
        created_at: toISOString(p.createdAt),
      })),
      start_location: e.startLocation ?? null,
      end_location: e.endLocation ?? null,
      facebook_event_url: e.facebookEventUrl ?? null,
      pre_ride_event_id: e.preRideEventId ?? null,
      ride_cost: e.rideCost ?? null,
      event_attendees: await this.getAttendees(id),
      ride_member_attendees: await this.getMemberAttendees(id),
      event_assets: await this.getAssets(id),
      ride_schedule_items: await this.getScheduleItems(id),
      incidents,
    };
  }

  private async getAttendees(eventId: string) {
    const attendees = await this.ds.getRepository(EventAttendee).find({
      where: { eventId },
      order: { sortOrder: "ASC" },
    });
    const contactRepo = this.ds.getRepository(Contact);
    return Promise.all(
      attendees.map(async (a) => {
        const c = await contactRepo.findOne({ where: { id: a.contactId }, select: ["id", "displayName"] });
        return {
          id: a.id,
          event_id: a.eventId,
          contact_id: a.contactId,
          sort_order: a.sortOrder ?? 0,
          waiver_signed: a.waiverSigned,
          contact: c ? { id: c.id, display_name: c.displayName } : undefined,
        };
      })
    );
  }

  private async getMemberAttendees(eventId: string) {
    const attendees = await this.ds.getRepository(EventRideMemberAttendee).find({
      where: { eventId },
      order: { sortOrder: "ASC" },
    });
    const memberRepo = this.ds.getRepository(Member);
    return Promise.all(
      attendees.map(async (a) => {
        const m = await memberRepo.findOne({ where: { id: a.memberId }, select: ["id", "name", "photo", "photoThumbnail"] });
        const memberApi = m ? memberRowToApi({ id: m.id, name: m.name, photo: m.photo, photo_thumbnail: m.photoThumbnail } as Record<string, unknown>) : undefined;
        return {
          id: a.id,
          event_id: a.eventId,
          member_id: a.memberId,
          sort_order: a.sortOrder ?? 0,
          waiver_signed: a.waiverSigned,
          member: memberApi ? { id: memberApi.id, name: memberApi.name, photo_thumbnail_url: memberApi.photo_thumbnail_url } : undefined,
        };
      })
    );
  }

  private async getAssets(eventId: string) {
    const assets = await this.ds.getRepository(EventAsset).find({
      where: { eventId },
      order: { sortOrder: "ASC" },
    });
    return assets.map((a) => ({
      id: a.id,
      event_id: a.eventId,
      sort_order: a.sortOrder ?? 0,
      photo_url: `/api/events/${eventId}/assets/${a.id}?size=full`,
      photo_thumbnail_url: `/api/events/${eventId}/assets/${a.id}?size=thumbnail`,
      photo_display_url: `/api/events/${eventId}/assets/${a.id}?size=display`,
      created_at: toISOString(a.createdAt),
    }));
  }

  private async getScheduleItems(eventId: string) {
    const items = await this.ds.getRepository(RideScheduleItem).find({
      where: { eventId },
      order: { sortOrder: "ASC" },
    });
    return items.map((s) => ({
      id: s.id,
      event_id: s.eventId,
      scheduled_time: toISOString(s.scheduledTime) ?? "",
      label: s.label,
      location: s.location ?? null,
      sort_order: s.sortOrder ?? 0,
    }));
  }

  private async getIncidents(eventId: string) {
    const incidentRepo = this.ds.getRepository(Incident);
    const incidents = await incidentRepo.find({
      where: { eventId },
      order: { occurredAt: "ASC", createdAt: "ASC" },
    });

    const contactIds = [
      ...new Set(
        incidents
          .map((i) => i.contactId)
          .filter((id): id is string => !!id)
      ),
    ];
    const memberIds = [
      ...new Set(
        incidents
          .map((i) => i.memberId)
          .filter((id): id is string => !!id)
      ),
    ];

    const contactRepo = this.ds.getRepository(Contact);
    const memberRepo = this.ds.getRepository(Member);

    const [contacts, members] = await Promise.all([
      contactIds.length
        ? contactRepo.find({
            where: { id: In(contactIds) },
            select: ["id", "displayName"],
          })
        : Promise.resolve([]),
      memberIds.length
        ? memberRepo.find({
            where: { id: In(memberIds) },
            select: ["id", "name", "photo", "photoThumbnail"],
          })
        : Promise.resolve([]),
    ]);

    const contactsMap = new Map<string, { id: string; display_name: string }>();
    for (const c of contacts) {
      contactsMap.set(c.id, { id: c.id, display_name: c.displayName });
    }

    const membersMap = new Map<
      string,
      { id: string; name: string; photo_thumbnail_url: string | null }
    >();
    for (const m of members) {
      const api = memberEntityToApi(m);
      membersMap.set(m.id, {
        id: api.id,
        name: api.name,
        photo_thumbnail_url: api.photo_thumbnail_url,
      });
    }

    return incidents.map((i) => ({
      id: i.id,
      event_id: i.eventId,
      contact_id: i.contactId,
      member_id: i.memberId,
      type: i.type,
      severity: i.severity,
      summary: i.summary,
      details: i.details ?? null,
      occurred_at: toISOStringOrNull(i.occurredAt),
      created_at: toISOString(i.createdAt),
      contact: i.contactId ? contactsMap.get(i.contactId) : undefined,
      member: i.memberId
        ? membersMap.get(i.memberId) && {
            id: membersMap.get(i.memberId)!.id,
            name: membersMap.get(i.memberId)!.name,
          }
        : undefined,
    }));
  }

  async listIncidents(page: number, perPage: number): Promise<IncidentListOutput> {
    const repo = this.ds.getRepository(Incident);
    const [rows, total] = await repo.findAndCount({
      order: { createdAt: "DESC", occurredAt: "DESC" },
      skip: (page - 1) * perPage,
      take: perPage,
    });

    if (rows.length === 0) {
      return { items: [], page, per_page: perPage, total };
    }

    const eventIds = [...new Set(rows.map((r) => r.eventId))];
    const events = await this.ds.getRepository(Event).find({
      where: { id: In(eventIds) },
      select: ["id", "name", "eventType"],
    });
    const eventsMap = new Map(events.map((e) => [e.id, e]));

    const contactIds = [
      ...new Set(
        rows
          .map((i) => i.contactId)
          .filter((id): id is string => !!id)
      ),
    ];
    const memberIds = [
      ...new Set(
        rows
          .map((i) => i.memberId)
          .filter((id): id is string => !!id)
      ),
    ];

    const contactRepo = this.ds.getRepository(Contact);
    const memberRepo = this.ds.getRepository(Member);

    const [contacts, members] = await Promise.all([
      contactIds.length
        ? contactRepo.find({
            where: { id: In(contactIds) },
            select: ["id", "displayName"],
          })
        : Promise.resolve([]),
      memberIds.length
        ? memberRepo.find({
            where: { id: In(memberIds) },
            select: ["id", "name", "photo", "photoThumbnail"],
          })
        : Promise.resolve([]),
    ]);

    const contactsMap = new Map<string, { id: string; display_name: string }>();
    for (const c of contacts) {
      contactsMap.set(c.id, { id: c.id, display_name: c.displayName });
    }

    const membersMap = new Map<
      string,
      { id: string; name: string; photo_thumbnail_url: string | null }
    >();
    for (const m of members) {
      const api = memberEntityToApi(m);
      membersMap.set(m.id, {
        id: api.id,
        name: api.name,
        photo_thumbnail_url: api.photo_thumbnail_url,
      });
    }

    const items = rows.map((i) => {
      const event = eventsMap.get(i.eventId);
      return {
        id: i.id,
        event_id: i.eventId,
        contact_id: i.contactId,
        member_id: i.memberId,
        type: i.type,
        severity: i.severity,
        summary: i.summary,
        details: i.details ?? null,
        occurred_at: toISOStringOrNull(i.occurredAt),
        created_at: toISOString(i.createdAt),
        event_name: event?.name,
        event_type: (event?.eventType ?? "badger") as EventType,
        contact: i.contactId ? contactsMap.get(i.contactId) : undefined,
        member: i.memberId
          ? membersMap.get(i.memberId) && {
              id: membersMap.get(i.memberId)!.id,
              name: membersMap.get(i.memberId)!.name,
            }
          : undefined,
      };
    });

    return { items, page, per_page: perPage, total };
  }

  async create(body: {
    name: string;
    event_type?: EventType;
    description?: string;
    year?: number;
    event_date?: string;
    event_url?: string;
    event_location?: string;
    event_location_embed?: string;
    ga_ticket_cost?: number;
    day_pass_cost?: number;
    ga_tickets_sold?: number;
    day_passes_sold?: number;
    budget_id?: string;
    scenario_id?: string;
    planning_notes?: string;
    start_location?: string;
    end_location?: string;
    facebook_event_url?: string;
    pre_ride_event_id?: string;
    ride_cost?: number;
    show_on_website?: boolean;
  }): Promise<EventCreateOutput> {
    const id = uuid();
    const eventType = body.event_type ?? "badger";
    const showOnWebsite = body.show_on_website !== false;
    await this.db.run(
      `INSERT INTO events (id, name, event_type, description, year, event_date, event_url, event_location, event_location_embed, ga_ticket_cost, day_pass_cost, ga_tickets_sold, day_passes_sold, budget_id, scenario_id, planning_notes, start_location, end_location, facebook_event_url, pre_ride_event_id, ride_cost, show_on_website) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        body.name,
        eventType,
        body.description ?? null,
        body.year ?? null,
        body.event_date ?? null,
        body.event_url ?? null,
        body.event_location ?? null,
        body.event_location_embed ?? null,
        body.ga_ticket_cost ?? null,
        body.day_pass_cost ?? null,
        body.ga_tickets_sold ?? null,
        body.day_passes_sold ?? null,
        body.budget_id ?? null,
        body.scenario_id ?? null,
        body.planning_notes ?? null,
        body.start_location ?? null,
        body.end_location ?? null,
        body.facebook_event_url ?? null,
        body.pre_ride_event_id ?? null,
        body.ride_cost ?? null,
        showOnWebsite,
      ]
    );
    const created = await this.get(id);
    if (!created) throw new Error("Event not found after create");
    return created;
  }

  async update(id: string, body: Partial<{
    name: string;
    event_type: string;
    description: string;
    year: number;
    event_date: string;
    event_url: string;
    event_location: string;
    event_location_embed: string;
    ga_ticket_cost: number;
    day_pass_cost: number;
    ga_tickets_sold: number;
    day_passes_sold: number;
    budget_id: string;
    scenario_id: string;
    planning_notes: string;
    start_location: string;
    end_location: string;
    facebook_event_url: string;
    pre_ride_event_id: string;
    ride_cost: number;
    show_on_website: boolean;
  }>): Promise<EventUpdateOutput | null> {
    /* Original: SELECT * FROM events WHERE id = ? */
    const existing = await this.ds.getRepository(Event).findOne({ where: { id } });
    if (!existing) return null;
    const name = body.name ?? existing.name;
    const event_type = body.event_type !== undefined ? body.event_type : existing.eventType;
    const description = body.description !== undefined ? body.description : existing.description;
    const year = body.year !== undefined ? body.year : existing.year;
    const event_date = body.event_date !== undefined ? body.event_date : existing.eventDate;
    const event_url = body.event_url !== undefined ? body.event_url : existing.eventUrl;
    const event_location = body.event_location !== undefined ? body.event_location : existing.eventLocation;
    const event_location_embed = body.event_location_embed !== undefined ? body.event_location_embed : existing.eventLocationEmbed;
    const ga_ticket_cost = body.ga_ticket_cost !== undefined ? body.ga_ticket_cost : existing.gaTicketCost;
    const day_pass_cost = body.day_pass_cost !== undefined ? body.day_pass_cost : existing.dayPassCost;
    const ga_tickets_sold = body.ga_tickets_sold !== undefined ? body.ga_tickets_sold : existing.gaTicketsSold;
    const day_passes_sold = body.day_passes_sold !== undefined ? body.day_passes_sold : existing.dayPassesSold;
    const budget_id = body.budget_id !== undefined ? body.budget_id : existing.budgetId;
    const scenario_id = body.scenario_id !== undefined ? body.scenario_id : existing.scenarioId;
    const planning_notes = body.planning_notes !== undefined ? body.planning_notes : existing.planningNotes;
    const start_location = body.start_location !== undefined ? body.start_location : existing.startLocation;
    const end_location = body.end_location !== undefined ? body.end_location : existing.endLocation;
    const facebook_event_url = body.facebook_event_url !== undefined ? body.facebook_event_url : existing.facebookEventUrl;
    const pre_ride_event_id = body.pre_ride_event_id !== undefined ? body.pre_ride_event_id : existing.preRideEventId;
    const ride_cost = body.ride_cost !== undefined ? body.ride_cost : existing.rideCost;
    const show_on_website = body.show_on_website !== undefined ? body.show_on_website : existing.showOnWebsite;
    await this.db.run(
      `UPDATE events SET name = ?, event_type = ?, description = ?, year = ?, event_date = ?, event_url = ?, event_location = ?, event_location_embed = ?, ga_ticket_cost = ?, day_pass_cost = ?, ga_tickets_sold = ?, day_passes_sold = ?, budget_id = ?, scenario_id = ?, planning_notes = ?, start_location = ?, end_location = ?, facebook_event_url = ?, pre_ride_event_id = ?, ride_cost = ?, show_on_website = ? WHERE id = ?`,
      [name, event_type, description, year, event_date, event_url, event_location, event_location_embed, ga_ticket_cost, day_pass_cost, ga_tickets_sold, day_passes_sold, budget_id, scenario_id, planning_notes, start_location, end_location, facebook_event_url, pre_ride_event_id, ride_cost, show_on_website, id]
    );
    return this.get(id)!;
  }

  async delete(id: string): Promise<EventDeleteOutput> {
    await this.db.run("DELETE FROM event_assignment_members WHERE assignment_id IN (SELECT id FROM event_assignments WHERE event_id = ?)", [id]);
    await this.db.run("DELETE FROM event_assignments WHERE event_id = ?", [id]);
    await this.db.run("DELETE FROM event_planning_milestones WHERE event_id = ?", [id]);
    await this.db.run("DELETE FROM event_packing_items WHERE event_id = ?", [id]);
    await this.db.run("DELETE FROM event_packing_categories WHERE event_id = ?", [id]);
    await this.db.run("DELETE FROM event_volunteers WHERE event_id = ?", [id]);
    await this.db.run("DELETE FROM event_photos WHERE event_id = ?", [id]);
    await this.db.run("DELETE FROM event_attendees WHERE event_id = ?", [id]);
    await this.db.run("DELETE FROM event_ride_member_attendees WHERE event_id = ?", [id]);
    await this.db.run("DELETE FROM event_assets WHERE event_id = ?", [id]);
    await this.db.run("DELETE FROM ride_schedule_items WHERE event_id = ?", [id]);
    await this.db.run("DELETE FROM events WHERE id = ?", [id]);
    return { ok: true as const };
  }

  async getPhoto(eventId: string, photoId: string, size: "thumbnail" | "display" | "full"): Promise<Buffer | null> {
    const photo = await this.ds.getRepository(EventPhoto).findOne({
      where: { id: photoId, eventId },
      select: ["photo", "photoThumbnail"],
    });
    if (!photo || !photo.photo) return null;
    const buffer = Buffer.from(photo.photo);
    const thumbnailBlob = photo.photoThumbnail;

    switch (size) {
      case "thumbnail":
        if (thumbnailBlob) return Buffer.from(thumbnailBlob);
        return ImageService.createThumbnail(buffer);
      case "display":
        return ImageService.createDisplay(buffer);
      case "full":
        return buffer;
      default:
        return buffer;
    }
  }

  async addPhoto(eventId: string, imageBuffer: Buffer): Promise<EventAddPhotoOutput | null> {
    const event = await this.ds.getRepository(Event).findOne({ where: { id: eventId } });
    if (!event) return null;

    const optimized = await ImageService.optimize(imageBuffer, 1920, 1920, 88);
    const photoBlob = optimized ?? imageBuffer;
    const thumbnailBlob = await ImageService.createThumbnail(photoBlob);

    const id = uuid();
    const maxResult = await this.ds.getRepository(EventPhoto).createQueryBuilder("p").select("COALESCE(MAX(p.sortOrder), 0)", "m").where("p.eventId = :eventId", { eventId }).getRawOne<{ m: number }>();
    const sortOrder = (maxResult?.m ?? 0) + 1;

    await this.db.run(
      "INSERT INTO event_photos (id, event_id, sort_order, photo, photo_thumbnail) VALUES (?, ?, ?, ?, ?)",
      [id, eventId, sortOrder, photoBlob, thumbnailBlob ?? photoBlob]
    );

    return {
      id,
      event_id: eventId,
      sort_order: sortOrder,
      photo_url: `/api/events/${eventId}/photos/${id}?size=full`,
      photo_thumbnail_url: `/api/events/${eventId}/photos/${id}?size=thumbnail`,
      photo_display_url: `/api/events/${eventId}/photos/${id}?size=display`,
      created_at: new Date().toISOString(),
    };
  }

  async deletePhoto(eventId: string, photoId: string): Promise<EventDeletePhotoOutput> {
    await this.ds.getRepository(EventPhoto).delete({
      id: photoId,
      eventId,
    });
    return { ok: true as const };
  }

  async getAsset(eventId: string, assetId: string, size: "thumbnail" | "display" | "full"): Promise<Buffer | null> {
    const asset = await this.ds.getRepository(EventAsset).findOne({
      where: { id: assetId, eventId },
      select: ["photo", "photoThumbnail"],
    });
    if (!asset || !asset.photo) return null;
    const buffer = Buffer.from(asset.photo);
    const thumbnailBlob = asset.photoThumbnail;
    switch (size) {
      case "thumbnail":
        if (thumbnailBlob) return Buffer.from(thumbnailBlob);
        return ImageService.createThumbnail(buffer);
      case "display":
        return ImageService.createDisplay(buffer);
      case "full":
        return buffer;
      default:
        return buffer;
    }
  }

  async addAsset(eventId: string, imageBuffer: Buffer): Promise<EventAddAssetOutput | null> {
    const event = await this.ds.getRepository(Event).findOne({ where: { id: eventId } });
    if (!event) return null;
    const optimized = await ImageService.optimize(imageBuffer, 1920, 1920, 88);
    const photoBlob = optimized ?? imageBuffer;
    const thumbnailBlob = await ImageService.createThumbnail(photoBlob);
    const id = uuid();
    const maxResult = await this.ds.getRepository(EventAsset).createQueryBuilder("a").select("COALESCE(MAX(a.sortOrder), 0)", "m").where("a.eventId = :eventId", { eventId }).getRawOne<{ m: number }>();
    const sortOrder = (maxResult?.m ?? 0) + 1;
    await this.db.run(
      "INSERT INTO event_assets (id, event_id, sort_order, photo, photo_thumbnail) VALUES (?, ?, ?, ?, ?)",
      [id, eventId, sortOrder, photoBlob, thumbnailBlob ?? photoBlob]
    );
    return {
      id,
      event_id: eventId,
      sort_order: sortOrder,
      photo_url: `/api/events/${eventId}/assets/${id}?size=full`,
      photo_thumbnail_url: `/api/events/${eventId}/assets/${id}?size=thumbnail`,
      photo_display_url: `/api/events/${eventId}/assets/${id}?size=display`,
      created_at: new Date().toISOString(),
    };
  }

  async deleteAsset(eventId: string, assetId: string): Promise<EventDeleteAssetOutput> {
    await this.ds.getRepository(EventAsset).delete({ id: assetId, eventId });
    return { ok: true as const };
  }

  attendees = {
    add: async (eventId: string, body: { contact_id: string; waiver_signed?: boolean }) => {
      const event = await this.ds.getRepository(Event).findOne({ where: { id: eventId } });
      if (!event) return null;
      const contact = await this.ds.getRepository(Contact).findOne({ where: { id: body.contact_id } });
      if (!contact) return null;
      const existing = await this.ds.getRepository(EventAttendee).findOne({ where: { eventId, contactId: body.contact_id } });
      if (existing) return null;
      const id = uuid();
      const maxResult = await this.ds.getRepository(EventAttendee).createQueryBuilder("a").select("COALESCE(MAX(a.sortOrder), 0)", "m").where("a.eventId = :eventId", { eventId }).getRawOne<{ m: number }>();
      const sortOrder = (maxResult?.m ?? 0) + 1;
      const waiverSigned = body.waiver_signed ?? false;
      await this.db.run(
        "INSERT INTO event_attendees (id, event_id, contact_id, sort_order, waiver_signed) VALUES (?, ?, ?, ?, ?)",
        [id, eventId, body.contact_id, sortOrder, waiverSigned]
      );
      return { id, event_id: eventId, contact_id: body.contact_id, sort_order: sortOrder, waiver_signed: body.waiver_signed ?? false, contact: { id: contact.id, display_name: contact.displayName } };
    },
    update: async (eventId: string, attendeeId: string, body: { waiver_signed?: boolean }) => {
      const existing = await this.ds.getRepository(EventAttendee).findOne({ where: { id: attendeeId, eventId } });
      if (!existing) return null;
      const waiverSigned = body.waiver_signed !== undefined ? body.waiver_signed : existing.waiverSigned;
      await this.db.run("UPDATE event_attendees SET waiver_signed = ? WHERE id = ? AND event_id = ?", [waiverSigned, attendeeId, eventId]);
      const attendees = await this.getAttendees(eventId);
      return attendees.find((a) => a.id === attendeeId) ?? null;
    },
    delete: async (eventId: string, attendeeId: string) => {
      await this.db.run("DELETE FROM event_attendees WHERE id = ? AND event_id = ?", [attendeeId, eventId]);
      return { ok: true };
    },
  };

  incidents = {
    create: async (
      eventId: string,
      body: {
        type: string;
        severity: string;
        summary: string;
        details?: string;
        occurred_at?: string;
        contact_id?: string;
        member_id?: string;
      }
    ) => {
      const event = await this.ds.getRepository(Event).findOne({
        where: { id: eventId },
      });
      if (!event) return null;

      if (body.contact_id) {
        const contact = await this.ds
          .getRepository(Contact)
          .findOne({ where: { id: body.contact_id } });
        if (!contact) return null;
      }

      if (body.member_id) {
        const member = await this.ds
          .getRepository(Member)
          .findOne({ where: { id: body.member_id } });
        if (!member) return null;
      }

      const id = uuid();
      await this.db.run(
        "INSERT INTO incidents (id, event_id, contact_id, member_id, type, severity, summary, details, occurred_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          id,
          eventId,
          body.contact_id ?? null,
          body.member_id ?? null,
          body.type,
          body.severity,
          body.summary,
          body.details ?? null,
          body.occurred_at ?? null,
        ]
      );

      const incidents = await this.getIncidents(eventId);
      return incidents.find((i) => i.id === id) ?? null;
    },
    update: async (
      eventId: string,
      incidentId: string,
      body: {
        type?: string;
        severity?: string;
        summary?: string;
        details?: string;
        occurred_at?: string | null;
        contact_id?: string | null;
        member_id?: string | null;
      }
    ) => {
      const existing = await this.ds.getRepository(Incident).findOne({
        where: { id: incidentId, eventId },
      });
      if (!existing) return null;

      let contactId =
        body.contact_id !== undefined ? body.contact_id : existing.contactId;
      let memberId =
        body.member_id !== undefined ? body.member_id : existing.memberId;

      if (contactId) {
        const contact = await this.ds
          .getRepository(Contact)
          .findOne({ where: { id: contactId } });
        if (!contact) return null;
      }

      if (memberId) {
        const member = await this.ds
          .getRepository(Member)
          .findOne({ where: { id: memberId } });
        if (!member) return null;
      }

      const type = body.type ?? existing.type;
      const severity = body.severity ?? existing.severity;
      const summary = body.summary ?? existing.summary;
      const details =
        body.details !== undefined ? body.details : existing.details;
      const occurred_at =
        body.occurred_at !== undefined ? body.occurred_at : existing.occurredAt;

      await this.db.run(
        "UPDATE incidents SET contact_id = ?, member_id = ?, type = ?, severity = ?, summary = ?, details = ?, occurred_at = ? WHERE id = ? AND event_id = ?",
        [
          contactId ?? null,
          memberId ?? null,
          type,
          severity,
          summary,
          details ?? null,
          occurred_at ?? null,
          incidentId,
          eventId,
        ]
      );

      const incidents = await this.getIncidents(eventId);
      return incidents.find((i) => i.id === incidentId) ?? null;
    },
    delete: async (eventId: string, incidentId: string) => {
      await this.db.run(
        "DELETE FROM incidents WHERE id = ? AND event_id = ?",
        [incidentId, eventId]
      );
      return { ok: true };
    },
  };

  memberAttendees = {
    add: async (eventId: string, body: { member_id: string; waiver_signed?: boolean }) => {
      const event = await this.ds.getRepository(Event).findOne({ where: { id: eventId } });
      if (!event) return null;
      const member = await this.ds.getRepository(Member).findOne({ where: { id: body.member_id } });
      if (!member) return null;
      const existing = await this.ds.getRepository(EventRideMemberAttendee).findOne({ where: { eventId, memberId: body.member_id } });
      if (existing) return null;
      const id = uuid();
      const maxResult = await this.ds.getRepository(EventRideMemberAttendee).createQueryBuilder("a").select("COALESCE(MAX(a.sortOrder), 0)", "m").where("a.eventId = :eventId", { eventId }).getRawOne<{ m: number }>();
      const sortOrder = (maxResult?.m ?? 0) + 1;
      const waiverSigned = body.waiver_signed ?? false;
      await this.db.run(
        "INSERT INTO event_ride_member_attendees (id, event_id, member_id, sort_order, waiver_signed) VALUES (?, ?, ?, ?, ?)",
        [id, eventId, body.member_id, sortOrder, waiverSigned]
      );
      return { id, event_id: eventId, member_id: body.member_id, sort_order: sortOrder, waiver_signed: body.waiver_signed ?? false, member: { id: member.id, name: member.name } };
    },
    update: async (eventId: string, attendeeId: string, body: { waiver_signed?: boolean }) => {
      const existing = await this.ds.getRepository(EventRideMemberAttendee).findOne({ where: { id: attendeeId, eventId } });
      if (!existing) return null;
      const waiverSigned = body.waiver_signed !== undefined ? body.waiver_signed : existing.waiverSigned;
      await this.db.run("UPDATE event_ride_member_attendees SET waiver_signed = ? WHERE id = ? AND event_id = ?", [waiverSigned, attendeeId, eventId]);
      const attendees = await this.getMemberAttendees(eventId);
      return attendees.find((a) => a.id === attendeeId) ?? null;
    },
    delete: async (eventId: string, attendeeId: string) => {
      await this.db.run("DELETE FROM event_ride_member_attendees WHERE id = ? AND event_id = ?", [attendeeId, eventId]);
      return { ok: true };
    },
  };

  scheduleItems = {
    create: async (eventId: string, body: { scheduled_time: string; label: string; location?: string }) => {
      const event = await this.ds.getRepository(Event).findOne({ where: { id: eventId } });
      if (!event) return null;
      const id = uuid();
      const maxResult = await this.ds.getRepository(RideScheduleItem).createQueryBuilder("s").select("COALESCE(MAX(s.sortOrder), 0)", "m").where("s.eventId = :eventId", { eventId }).getRawOne<{ m: number }>();
      const sortOrder = (maxResult?.m ?? 0) + 1;
      await this.db.run(
        "INSERT INTO ride_schedule_items (id, event_id, scheduled_time, label, location, sort_order) VALUES (?, ?, ?, ?, ?, ?)",
        [id, eventId, body.scheduled_time, body.label, body.location ?? null, sortOrder]
      );
      return { id, event_id: eventId, scheduled_time: body.scheduled_time, label: body.label, location: body.location ?? null, sort_order: sortOrder };
    },
    update: async (eventId: string, scheduleId: string, body: { scheduled_time?: string; label?: string; location?: string | null }) => {
      const existing = await this.ds.getRepository(RideScheduleItem).findOne({ where: { id: scheduleId, eventId } });
      if (!existing) return null;
      const scheduled_time = body.scheduled_time ?? existing.scheduledTime;
      const label = body.label ?? existing.label;
      const location = body.location !== undefined ? body.location : existing.location;
      await this.db.run(
        "UPDATE ride_schedule_items SET scheduled_time = ?, label = ?, location = ? WHERE id = ? AND event_id = ?",
        [scheduled_time, label, location, scheduleId, eventId]
      );
      const items = await this.getScheduleItems(eventId);
      return items.find((s) => s.id === scheduleId) ?? null;
    },
    delete: async (eventId: string, scheduleId: string) => {
      await this.db.run("DELETE FROM ride_schedule_items WHERE id = ? AND event_id = ?", [scheduleId, eventId]);
      return { ok: true };
    },
  };

  assignments = {
    create: async (eventId: string, body: { name: string; category: EventAssignmentCategory }) => {
      const id = uuid();
      /* Original: SELECT COALESCE(MAX(sort_order), 0) as m FROM event_assignments WHERE event_id = ? AND category = ? */
      const maxResult = await this.ds.getRepository(EventAssignment).createQueryBuilder("a").select("COALESCE(MAX(a.sortOrder), 0)", "m").where("a.eventId = :eventId", { eventId }).andWhere("a.category = :category", { category: body.category }).getRawOne<{ m: number }>();
      const sortOrder = (maxResult?.m ?? 0) + 1;
      await this.db.run(
        "INSERT INTO event_assignments (id, event_id, name, category, sort_order) VALUES (?, ?, ?, ?, ?)",
        [id, eventId, body.name, body.category, sortOrder]
      );
      return { id, event_id: eventId, name: body.name, category: body.category, sort_order: sortOrder, members: [] };
    },
    update: async (eventId: string, aid: string, body: { name?: string; category?: EventAssignmentCategory }) => {
      /* Original: SELECT * FROM event_assignments WHERE id = ? AND event_id = ? */
      const existing = await this.ds.getRepository(EventAssignment).findOne({ where: { id: aid, eventId } });
      if (!existing) return null;
      const name = body.name ?? existing.name;
      const category = (body.category ?? existing.category) as EventAssignmentCategory;
      await this.db.run("UPDATE event_assignments SET name = ?, category = ? WHERE id = ? AND event_id = ?", [name, category, aid, eventId]);
      /* Original: SELECT * FROM event_assignment_members WHERE assignment_id = ? ORDER BY sort_order */
      const amList = await this.ds.getRepository(EventAssignmentMember).find({
        where: { assignmentId: aid },
        order: { sortOrder: "ASC" },
      });
      const memberRepo = this.ds.getRepository(Member);
      const members = await Promise.all(
        amList.map(async (am) => {
          const m = await memberRepo.findOne({ where: { id: am.memberId }, select: ["id", "name", "photo", "photoThumbnail"] });
          return {
            id: am.id,
            assignment_id: am.assignmentId,
            member_id: am.memberId,
            sort_order: am.sortOrder ?? 0,
            member: m ? memberEntityToApi(m) : undefined,
          };
        })
      );
      return { id: aid, event_id: eventId, name, category, sort_order: existing.sortOrder, members };
    },
    delete: async (eventId: string, aid: string) => {
      await this.db.run("DELETE FROM event_assignment_members WHERE assignment_id = ?", [aid]);
      await this.db.run("DELETE FROM event_assignments WHERE id = ? AND event_id = ?", [aid, eventId]);
      return { ok: true };
    },
    addMember: async (eventId: string, aid: string, memberId: string) => {
      /* Original: SELECT * FROM event_assignments WHERE id = ? AND event_id = ? */
      const existing = await this.ds.getRepository(EventAssignment).findOne({ where: { id: aid, eventId } });
      if (!existing) return null;
      /* Original: SELECT COALESCE(MAX(sort_order), 0) as m FROM event_assignment_members WHERE assignment_id = ? */
      const maxResult = await this.ds.getRepository(EventAssignmentMember).createQueryBuilder("am").select("COALESCE(MAX(am.sortOrder), 0)", "m").where("am.assignmentId = :aid", { aid }).getRawOne<{ m: number }>();
      const id = uuid();
      try {
        await this.db.run(
          "INSERT INTO event_assignment_members (id, assignment_id, member_id, sort_order) VALUES (?, ?, ?, ?)",
          [id, aid, memberId, (maxResult?.m ?? 0) + 1]
        );
      } catch {
        return null;
      }
      return this.get(eventId);
    },
    removeMember: async (eventId: string, aid: string, memberId: string) => {
      await this.db.run("DELETE FROM event_assignment_members WHERE assignment_id = ? AND member_id = ?", [aid, memberId]);
      return this.get(eventId);
    },
  };

  milestones = {
    create: async (eventId: string, body: { month: number; year: number; description: string; due_date?: string }) => {
      const id = uuid();
      /* Original: SELECT COALESCE(MAX(sort_order), 0) as m FROM event_planning_milestones WHERE event_id = ? */
      const maxResult = await this.ds.getRepository(EventPlanningMilestone).createQueryBuilder("m").select("COALESCE(MAX(m.sortOrder), 0)", "m").where("m.eventId = :eventId", { eventId }).getRawOne<{ m: number }>();
      const lastDay = new Date(body.year, body.month, 0);
      const dueDate = body.due_date ?? `${body.year}-${String(body.month).padStart(2, "0")}-${String(lastDay.getDate()).padStart(2, "0")}`;
      await this.db.run(
        "INSERT INTO event_planning_milestones (id, event_id, month, year, description, sort_order, completed, due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [id, eventId, body.month, body.year, body.description, (maxResult?.m ?? 0) + 1, false, dueDate]
      );
      return { id, event_id: eventId, ...body, sort_order: (maxResult?.m ?? 0) + 1, completed: false, due_date: dueDate };
    },
    update: async (eventId: string, mid: string, body: { month?: number; year?: number; description?: string; completed?: boolean; due_date?: string }) => {
      /* Original: SELECT * FROM event_planning_milestones WHERE id = ? AND event_id = ? */
      const existing = await this.ds.getRepository(EventPlanningMilestone).findOne({ where: { id: mid, eventId } });
      if (!existing) return null;
      const month = body.month ?? existing.month;
      const year = body.year ?? existing.year;
      const description = body.description ?? existing.description;
      const completed = body.completed !== undefined ? body.completed : existing.completed;
      const dueDate = body.due_date ?? existing.dueDate;
      await this.db.run("UPDATE event_planning_milestones SET month = ?, year = ?, description = ?, completed = ?, due_date = ? WHERE id = ? AND event_id = ?", [month, year, description, completed, dueDate, mid, eventId]);
      return { id: mid, event_id: eventId, month, year, description, sort_order: existing.sortOrder, completed, due_date: dueDate };
    },
    delete: async (eventId: string, mid: string) => {
      await this.db.run("DELETE FROM event_planning_milestones WHERE id = ? AND event_id = ?", [mid, eventId]);
      return { ok: true };
    },
    addMember: async (eventId: string, mid: string, memberId: string) => {
      /* Original: SELECT 1 FROM event_planning_milestones WHERE id = ? AND event_id = ? */
      const existing = await this.ds.getRepository(EventPlanningMilestone).findOne({ where: { id: mid, eventId } });
      if (!existing) return null;
      const id = uuid();
      /* Original: SELECT COALESCE(MAX(sort_order), 0) as m FROM event_milestone_members WHERE milestone_id = ? */
      const maxResult = await this.ds.getRepository(EventMilestoneMember).createQueryBuilder("mm").select("COALESCE(MAX(mm.sortOrder), 0)", "m").where("mm.milestoneId = :mid", { mid }).getRawOne<{ m: number }>();
      await this.db.run(
        "INSERT INTO event_milestone_members (id, milestone_id, member_id, sort_order) VALUES (?, ?, ?, ?)",
        [id, mid, memberId, (maxResult?.m ?? 0) + 1]
      );
      return this.get(eventId);
    },
    removeMember: async (eventId: string, mid: string, memberId: string) => {
      await this.db.run("DELETE FROM event_milestone_members WHERE milestone_id = ? AND member_id = ?", [mid, memberId]);
      return this.get(eventId);
    },
  };

  packingCategories = {
    create: async (eventId: string, body: { name: string }) => {
      const id = uuid();
      /* Original: SELECT COALESCE(MAX(sort_order), 0) as m FROM event_packing_categories WHERE event_id = ? */
      const maxResult = await this.ds.getRepository(EventPackingCategory).createQueryBuilder("c").select("COALESCE(MAX(c.sortOrder), 0)", "m").where("c.eventId = :eventId", { eventId }).getRawOne<{ m: number }>();
      await this.db.run(
        "INSERT INTO event_packing_categories (id, event_id, name, sort_order) VALUES (?, ?, ?, ?)",
        [id, eventId, body.name, (maxResult?.m ?? 0) + 1]
      );
      return { id, event_id: eventId, name: body.name, sort_order: (maxResult?.m ?? 0) + 1 };
    },
    update: async (eventId: string, cid: string, body: { name?: string }) => {
      /* Original: SELECT * FROM event_packing_categories WHERE id = ? AND event_id = ? */
      const existing = await this.ds.getRepository(EventPackingCategory).findOne({ where: { id: cid, eventId } });
      if (!existing) return null;
      const name = body.name ?? existing.name;
      await this.db.run("UPDATE event_packing_categories SET name = ? WHERE id = ? AND event_id = ?", [name, cid, eventId]);
      return { id: cid, event_id: eventId, name, sort_order: existing.sortOrder };
    },
    delete: async (eventId: string, cid: string) => {
      await this.db.run("DELETE FROM event_packing_categories WHERE id = ? AND event_id = ?", [cid, eventId]);
      return { ok: true };
    },
  };

  packingItems = {
    create: async (eventId: string, body: { category_id: string; name: string; quantity?: number; note?: string }) => {
      const id = uuid();
      /* Original: SELECT COALESCE(MAX(sort_order), 0) as m FROM event_packing_items WHERE event_id = ? AND category_id = ? */
      const maxResult = await this.ds.getRepository(EventPackingItem).createQueryBuilder("p").select("COALESCE(MAX(p.sortOrder), 0)", "m").where("p.eventId = :eventId", { eventId }).andWhere("p.categoryId = :categoryId", { categoryId: body.category_id }).getRawOne<{ m: number }>();
      await this.db.run(
        "INSERT INTO event_packing_items (id, event_id, category_id, name, sort_order, quantity, note, loaded) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [id, eventId, body.category_id, body.name, (maxResult?.m ?? 0) + 1, body.quantity ?? null, body.note ?? null, false]
      );
      return { id, event_id: eventId, category_id: body.category_id, name: body.name, sort_order: (maxResult?.m ?? 0) + 1, quantity: body.quantity ?? null, note: body.note ?? null, loaded: false };
    },
    update: async (eventId: string, pid: string, body: { category_id?: string; name?: string; quantity?: number; note?: string; loaded?: boolean }) => {
      /* Original: SELECT * FROM event_packing_items WHERE id = ? AND event_id = ? */
      const existing = await this.ds.getRepository(EventPackingItem).findOne({ where: { id: pid, eventId } });
      if (!existing) return null;
      const category_id = body.category_id ?? existing.categoryId;
      const name = body.name ?? existing.name;
      const quantity = body.quantity !== undefined ? body.quantity : existing.quantity;
      const note = body.note !== undefined ? body.note : existing.note;
      const loaded = body.loaded !== undefined ? body.loaded : existing.loaded;
      await this.db.run("UPDATE event_packing_items SET category_id = ?, name = ?, quantity = ?, note = ?, loaded = ? WHERE id = ? AND event_id = ?", [category_id, name, quantity, note, loaded, pid, eventId]);
      return { id: pid, event_id: eventId, category_id, name, sort_order: existing.sortOrder, quantity, note, loaded };
    },
    delete: async (eventId: string, pid: string) => {
      await this.db.run("DELETE FROM event_packing_items WHERE id = ? AND event_id = ?", [pid, eventId]);
      return { ok: true };
    },
  };

  volunteers = {
    create: async (eventId: string, body: { name: string; department: string }) => {
      const id = uuid();
      /* Original: SELECT COALESCE(MAX(sort_order), 0) as m FROM event_volunteers WHERE event_id = ? */
      const maxResult = await this.ds.getRepository(EventVolunteer).createQueryBuilder("v").select("COALESCE(MAX(v.sortOrder), 0)", "m").where("v.eventId = :eventId", { eventId }).getRawOne<{ m: number }>();
      await this.db.run(
        "INSERT INTO event_volunteers (id, event_id, name, department, sort_order) VALUES (?, ?, ?, ?, ?)",
        [id, eventId, body.name, body.department, (maxResult?.m ?? 0) + 1]
      );
      return { id, event_id: eventId, ...body, sort_order: (maxResult?.m ?? 0) + 1 };
    },
    update: async (eventId: string, vid: string, body: { name?: string; department?: string }) => {
      /* Original: SELECT * FROM event_volunteers WHERE id = ? AND event_id = ? */
      const existing = await this.ds.getRepository(EventVolunteer).findOne({ where: { id: vid, eventId } });
      if (!existing) return null;
      const name = body.name ?? existing.name;
      const department = body.department ?? existing.department;
      await this.db.run("UPDATE event_volunteers SET name = ?, department = ? WHERE id = ? AND event_id = ?", [name, department, vid, eventId]);
      return { id: vid, event_id: eventId, name, department, sort_order: existing.sortOrder };
    },
    delete: async (eventId: string, vid: string) => {
      await this.db.run("DELETE FROM event_volunteers WHERE id = ? AND event_id = ?", [vid, eventId]);
      return { ok: true };
    },
  };
}
