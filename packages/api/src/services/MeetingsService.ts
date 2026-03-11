import { In } from "typeorm";
import type { DataSource } from "typeorm";
import {
  Document,
  Meeting,
  MeetingMotion,
  MeetingActionItem,
  OldBusinessItem,
  MeetingTemplate,
  Member,
} from "../entities";
import type { ActionItemStatus, MotionResult, OldBusinessStatus } from "@satyrsmc/shared/lib/enums";
import { uuid } from "./utils";
import { toISOString, toISOStringOrNull } from "../lib/date";
import type {
  MeetingCreateOldBusinessOutput,
  MeetingCreateOutput,
  MeetingDeleteOutput,
  MeetingDetail,
  MeetingListOutput,
  MeetingUpdateOldBusinessOutput,
  MeetingUpdateOutput,
} from "@satyrsmc/shared/dto/admin/meeting";

const EMPTY_DOC = JSON.stringify({ type: "doc", content: [{ type: "paragraph" }] });

export class MeetingsService {
  constructor(private ds: DataSource) {}

  async list(sort?: "date" | "meeting_number"): Promise<MeetingListOutput> {
    const repo = this.ds.getRepository(Meeting);
    const order: Record<string, "ASC" | "DESC"> =
      sort === "meeting_number"
        ? { meetingNumber: "DESC" }
        : { date: "DESC" };
    const entities = await repo.find({ order });
    const docMap = await this.fetchDocumentsForMeetings(entities);
    const meetingIds = entities.map((m) => m.id);
    const motionCounts = await this.getMotionCountsByMeetingId(meetingIds);
    return entities.map((m) => ({
      ...this.meetingToApi(m, docMap),
      motion_count: motionCounts.get(m.id) ?? 0,
    }));
  }

  async create(body: {
    date: string;
    meeting_number: number;
    location?: string | null;
    start_time?: string | null;
    end_time?: string | null;
    video_conference_url?: string | null;
    previous_meeting_id?: string | null;
    agenda_content?: string;
    minutes_content?: string | null;
    agenda_template_id?: string;
  }): Promise<MeetingCreateOutput | null> {
    let agendaContent = body.agenda_content ?? EMPTY_DOC;
    if (body.agenda_template_id) {
      const template = await this.ds.getRepository(MeetingTemplate).findOne({
        where: { id: body.agenda_template_id, type: "agenda" },
      });
      if (template) {
        const agendaDoc = await this.ds.getRepository(Document).findOne({
          where: { id: template.documentId },
        });
        if (agendaDoc) agendaContent = agendaDoc.content;
      }
    }
    const now = new Date().toISOString();
    const agendaDoc = this.ds.getRepository(Document).create({
      id: uuid(),
      content: agendaContent,
      createdAt: now,
      updatedAt: now,
    });
    await this.ds.getRepository(Document).save(agendaDoc);
    const minutesDoc = this.ds.getRepository(Document).create({
      id: uuid(),
      content: body.minutes_content ?? EMPTY_DOC,
      createdAt: now,
      updatedAt: now,
    });
    await this.ds.getRepository(Document).save(minutesDoc);
    const meeting = this.ds.getRepository(Meeting).create({
      id: uuid(),
      date: body.date,
      meetingNumber: body.meeting_number,
      location: body.location ?? null,
      startTime: body.start_time ?? null,
      endTime: body.end_time ?? null,
      videoConferenceUrl: body.video_conference_url ?? null,
      previousMeetingId: body.previous_meeting_id ?? null,
      agendaDocumentId: agendaDoc.id,
      minutesDocumentId: minutesDoc.id,
      createdAt: now,
      updatedAt: now,
    });
    await this.ds.getRepository(Meeting).save(meeting);
    const docMap = new Map<string, Document>([
      [agendaDoc.id, agendaDoc],
      [minutesDoc.id, minutesDoc],
    ]);
    return this.meetingToApi(meeting, docMap);
  }

  async get(id: string): Promise<MeetingDetail | null> {
    const meeting = await this.ds.getRepository(Meeting).findOne({ where: { id } });
    if (!meeting) return null;
    const motions = await this.ds.getRepository(MeetingMotion).find({
      where: { meetingId: id },
      order: { orderIndex: "ASC", createdAt: "ASC" },
    });
    const actionItems = await this.ds.getRepository(MeetingActionItem).find({
      where: { meetingId: id },
      order: { orderIndex: "ASC", createdAt: "ASC" },
    });
    const meetingDate = meeting.date;
    const allMeetingsBefore = await this.ds.getRepository(Meeting).find({
      where: {},
      order: { date: "ASC" },
    });
    const meetingOrder = allMeetingsBefore.findIndex((m) => m.id === id);
    const priorMeetingIds = new Set(
      allMeetingsBefore.slice(0, meetingOrder).map((m) => m.id)
    );
    const oldBusiness = await this.ds.getRepository(OldBusinessItem).find({
      where: {},
      order: { orderIndex: "ASC", createdAt: "ASC" },
    });
    const oldBusinessForMeeting = oldBusiness.filter(
      (ob) => ob.status === "open" && priorMeetingIds.has(ob.meetingId)
    );
    const newOldBusiness = oldBusiness.filter((ob) => ob.meetingId === id);
    const assigneeIds = [...new Set(actionItems.map((a) => a.assigneeMemberId).filter(Boolean) as string[])];
    const motionMemberIds = [...new Set([
      ...motions.map((m) => m.moverMemberId).filter(Boolean),
      ...motions.map((m) => m.seconderMemberId).filter(Boolean),
    ] as string[])];
    const allMemberIds = [...new Set([...assigneeIds, ...motionMemberIds])];
    const membersMap = new Map<string, { id: string; name: string }>();
    if (allMemberIds.length) {
      const members = await this.ds.getRepository(Member).find({
        where: { id: In(allMemberIds) },
        select: ["id", "name"],
      });
      for (const m of members) membersMap.set(m.id, { id: m.id, name: m.name });
    }
    const docMap = await this.fetchDocumentsForMeetings([meeting]);
    return {
      ...this.meetingToApi(meeting, docMap),
      motions: motions.map((m) => ({
        id: m.id,
        meeting_id: m.meetingId,
        description: m.description ?? null,
        result: m.result,
        order_index: m.orderIndex,
        mover_member_id: m.moverMemberId ?? null,
        seconder_member_id: m.seconderMemberId ?? null,
        mover_name: m.moverMemberId ? membersMap.get(m.moverMemberId)?.name ?? null : null,
        seconder_name: m.seconderMemberId ? membersMap.get(m.seconderMemberId)?.name ?? null : null,
        created_at: toISOString(m.createdAt),
      })),
      action_items: actionItems.map((a) => ({
        id: a.id,
        meeting_id: a.meetingId,
        description: a.description,
        assignee_member_id: a.assigneeMemberId ?? null,
        assignee_name: a.assigneeMemberId ? membersMap.get(a.assigneeMemberId)?.name ?? null : null,
        due_date: toISOStringOrNull(a.dueDate),
        status: a.status,
        completed_at: toISOStringOrNull(a.completedAt),
        order_index: a.orderIndex,
        created_at: toISOString(a.createdAt),
      })),
      old_business: [
        ...oldBusinessForMeeting.map((ob) => ({
          id: ob.id,
          meeting_id: ob.meetingId,
          description: ob.description,
          status: ob.status as OldBusinessStatus,
          closed_at: toISOStringOrNull(ob.closedAt),
          closed_in_meeting_id: ob.closedInMeetingId ?? null,
          order_index: ob.orderIndex,
          created_at: toISOString(ob.createdAt),
          is_carried: true,
        })),
        ...newOldBusiness.map((ob) => ({
          id: ob.id,
          meeting_id: ob.meetingId,
          description: ob.description,
          status: ob.status as OldBusinessStatus,
          closed_at: toISOStringOrNull(ob.closedAt),
          closed_in_meeting_id: ob.closedInMeetingId ?? null,
          order_index: ob.orderIndex,
          created_at: toISOString(ob.createdAt),
          is_carried: false,
        })),
      ].sort((a, b) => a.order_index - b.order_index),
    };
  }

  async update(id: string, body: Record<string, unknown>): Promise<MeetingUpdateOutput | null> {
    const meeting = await this.ds.getRepository(Meeting).findOne({ where: { id } });
    if (!meeting) return null;
    const updates: Partial<Meeting> = {};
    if (body.date !== undefined) updates.date = new Date(body.date as string);
    if (body.meeting_number !== undefined) updates.meetingNumber = body.meeting_number as number;
    if (body.location !== undefined) updates.location = body.location as string | null;
    if (body.start_time !== undefined) updates.startTime = (body.start_time as string | null) != null ? new Date(body.start_time as string) : null;
    if (body.end_time !== undefined) updates.endTime = (body.end_time as string | null) != null ? new Date(body.end_time as string) : null;
    if (body.video_conference_url !== undefined) updates.videoConferenceUrl = body.video_conference_url as string | null;
    if (body.previous_meeting_id !== undefined) updates.previousMeetingId = body.previous_meeting_id as string | null;
    updates.updatedAt = new Date();
    await this.ds.getRepository(Meeting).update(id, updates);
    const updated = await this.ds.getRepository(Meeting).findOne({ where: { id } });
    if (!updated) return null;
    const docMap = await this.fetchDocumentsForMeetings([updated]);
    return this.meetingToApi(updated, docMap);
  }

  async delete(
    id: string,
    options?: { delete_agenda?: boolean; delete_minutes?: boolean }
  ): Promise<MeetingDeleteOutput> {
    const meeting = await this.ds.getRepository(Meeting).findOne({ where: { id } });
    if (!meeting) return;
    const deleteAgenda = options?.delete_agenda !== false;
    const deleteMinutes = options?.delete_minutes !== false;
    const docIds: string[] = [];
    if (deleteAgenda) docIds.push(meeting.agendaDocumentId);
    if (deleteMinutes && meeting.minutesDocumentId)
      docIds.push(meeting.minutesDocumentId);
    if (docIds.length) {
      await this.ds.getRepository(Document).delete(docIds);
    }
    await this.ds.getRepository(Meeting).delete(id);
  }

  async createMotion(meetingId: string, body: {
    description?: string | null;
    result: string;
    order_index?: number;
    mover_member_id: string;
    seconder_member_id: string;
  }) {
    const maxOrder = await this.ds.getRepository(MeetingMotion)
      .createQueryBuilder("m")
      .select("MAX(m.order_index)", "max")
      .where("m.meeting_id = :meetingId", { meetingId })
      .getRawOne();
    const orderIndex = body.order_index ?? ((maxOrder?.max ?? -1) + 1);
    const motion = this.ds.getRepository(MeetingMotion).create({
      id: uuid(),
      meetingId,
      description: body.description ?? null,
      result: body.result as MotionResult,
      orderIndex,
      moverMemberId: body.mover_member_id,
      seconderMemberId: body.seconder_member_id,
      createdAt: new Date(),
    });
    await this.ds.getRepository(MeetingMotion).save(motion);
    return {
      id: motion.id,
      meeting_id: motion.meetingId,
      description: motion.description ?? null,
      result: motion.result,
      order_index: motion.orderIndex,
      mover_member_id: motion.moverMemberId ?? null,
      seconder_member_id: motion.seconderMemberId ?? null,
      created_at: toISOString(motion.createdAt),
    };
  }

  async updateMotion(meetingId: string, mid: string, body: Record<string, unknown>) {
    const motion = await this.ds.getRepository(MeetingMotion).findOne({ where: { id: mid, meetingId } });
    if (!motion) return null;
    const updates: Partial<MeetingMotion> = {};
    if (body.description !== undefined) updates.description = body.description as string | null;
    if (body.result !== undefined) updates.result = body.result as MotionResult;
    if (body.order_index !== undefined) updates.orderIndex = body.order_index as number;
    if (body.mover_member_id !== undefined) updates.moverMemberId = body.mover_member_id as string | null;
    if (body.seconder_member_id !== undefined) updates.seconderMemberId = body.seconder_member_id as string | null;
    await this.ds.getRepository(MeetingMotion).update(mid, updates);
    const updated = await this.ds.getRepository(MeetingMotion).findOne({ where: { id: mid } });
    if (!updated) return null;
    return {
      id: updated.id,
      meeting_id: updated.meetingId,
      description: updated.description ?? null,
      result: updated.result,
      order_index: updated.orderIndex,
      mover_member_id: updated.moverMemberId ?? null,
      seconder_member_id: updated.seconderMemberId ?? null,
      created_at: toISOString(updated.createdAt),
    };
  }

  async deleteMotion(meetingId: string, mid: string) {
    const result = await this.ds.getRepository(MeetingMotion).delete({ id: mid, meetingId });
    return result.affected !== 0;
  }

  async createActionItem(meetingId: string, body: { description: string; assignee_member_id?: string | null; due_date?: string | null; order_index?: number }) {
    const maxOrder = await this.ds.getRepository(MeetingActionItem)
      .createQueryBuilder("a")
      .select("MAX(a.order_index)", "max")
      .where("a.meeting_id = :meetingId", { meetingId })
      .getRawOne();
    const orderIndex = body.order_index ?? ((maxOrder?.max ?? -1) + 1);
    const item = this.ds.getRepository(MeetingActionItem).create({
      id: uuid(),
      meetingId,
      description: body.description,
      assigneeMemberId: body.assignee_member_id ?? null,
      dueDate: body.due_date ?? null,
      status: "open",
      orderIndex,
      createdAt: new Date().toISOString(),
    });
    await this.ds.getRepository(MeetingActionItem).save(item);
    return {
      id: item.id,
      meeting_id: item.meetingId,
      description: item.description,
      assignee_member_id: item.assigneeMemberId ?? null,
      due_date: toISOStringOrNull(item.dueDate),
      status: item.status,
      order_index: item.orderIndex,
      created_at: toISOString(item.createdAt),
    };
  }

  async updateActionItem(meetingId: string, aid: string, body: Record<string, unknown>) {
    const item = await this.ds.getRepository(MeetingActionItem).findOne({ where: { id: aid, meetingId } });
    if (!item) return null;
    const updates: Partial<MeetingActionItem> = {};
    if (body.description !== undefined) updates.description = body.description as string;
    if (body.assignee_member_id !== undefined) updates.assigneeMemberId = body.assignee_member_id as string | null;
    if (body.due_date !== undefined) updates.dueDate = (body.due_date as string | null) != null ? new Date(body.due_date as string) : null;
    if (body.status !== undefined) {
      updates.status = body.status as ActionItemStatus;
      if (body.status === "completed") updates.completedAt = new Date();
    }
    if (body.order_index !== undefined) updates.orderIndex = body.order_index as number;
    await this.ds.getRepository(MeetingActionItem).update(aid, updates);
    const updated = await this.ds.getRepository(MeetingActionItem).findOne({ where: { id: aid } });
    return updated
      ? {
          id: updated.id,
          meeting_id: updated.meetingId,
          description: updated.description,
          assignee_member_id: updated.assigneeMemberId ?? null,
          due_date: toISOStringOrNull(updated.dueDate),
          status: updated.status,
          completed_at: toISOStringOrNull(updated.completedAt),
          order_index: updated.orderIndex,
          created_at: toISOString(updated.createdAt),
        }
      : null;
  }

  async deleteActionItem(meetingId: string, aid: string) {
    const result = await this.ds.getRepository(MeetingActionItem).delete({ id: aid, meetingId });
    return result.affected !== 0;
  }

  async createOldBusiness(
    meetingId: string,
    body: { description: string; order_index?: number }
  ): Promise<MeetingCreateOldBusinessOutput> {
    const maxOrder = await this.ds.getRepository(OldBusinessItem)
      .createQueryBuilder("o")
      .select("MAX(o.order_index)", "max")
      .where("o.meeting_id = :meetingId", { meetingId })
      .getRawOne();
    const orderIndex = body.order_index ?? ((maxOrder?.max ?? -1) + 1);
    const item = this.ds.getRepository(OldBusinessItem).create({
      id: uuid(),
      meetingId,
      description: body.description,
      status: "open",
      orderIndex,
      createdAt: new Date().toISOString(),
    });
    await this.ds.getRepository(OldBusinessItem).save(item);
    return {
      id: item.id,
      meeting_id: item.meetingId,
      description: item.description,
      status: item.status as OldBusinessStatus,
      order_index: item.orderIndex,
      created_at: toISOString(item.createdAt),
    };
  }

  async updateOldBusiness(
    meetingId: string,
    oid: string,
    body: Record<string, unknown>
  ): Promise<MeetingUpdateOldBusinessOutput | null> {
    const item = await this.ds.getRepository(OldBusinessItem).findOne({ where: { id: oid, meetingId } });
    if (!item) return null;
    const updates: Partial<OldBusinessItem> = {};
    if (body.description !== undefined) updates.description = body.description as string;
    if (body.status !== undefined) {
      updates.status = body.status as OldBusinessStatus;
      if (body.status === "closed") {
        updates.closedAt = new Date();
        updates.closedInMeetingId = (body.closed_in_meeting_id as string) ?? meetingId;
      }
    }
    if (body.closed_in_meeting_id !== undefined) updates.closedInMeetingId = body.closed_in_meeting_id as string | null;
    if (body.order_index !== undefined) updates.orderIndex = body.order_index as number;
    await this.ds.getRepository(OldBusinessItem).update(oid, updates);
    const updated = await this.ds.getRepository(OldBusinessItem).findOne({ where: { id: oid } });
    return updated
      ? {
          id: updated.id,
          meeting_id: updated.meetingId,
          description: updated.description,
          status: updated.status as OldBusinessStatus,
          closed_at: toISOStringOrNull(updated.closedAt),
          closed_in_meeting_id: updated.closedInMeetingId ?? null,
          order_index: updated.orderIndex,
          created_at: toISOString(updated.createdAt),
        }
      : null;
  }

  async deleteOldBusiness(meetingId: string, oid: string) {
    const result = await this.ds.getRepository(OldBusinessItem).delete({ id: oid, meetingId });
    return result.affected !== 0;
  }

  async listMotions(options: { page?: number; per_page?: number; q?: string } = {}) {
    const page = Math.max(1, options.page ?? 1);
    const perPage = Math.min(100, Math.max(1, options.per_page ?? 25));
    const skip = (page - 1) * perPage;
    const q = typeof options.q === "string" && options.q.trim() ? options.q.trim() : undefined;
    const searchPattern = q ? `%${options.q!.trim()}%` : undefined;

    const baseQb = () => {
      const qb = this.ds
        .getRepository(MeetingMotion)
        .createQueryBuilder("m")
        .innerJoin(Meeting, "mt", "mt.id = m.meeting_id")
        .orderBy("mt.date", "DESC")
        .addOrderBy("m.order_index", "ASC")
        .addOrderBy("m.created_at", "ASC");
      if (searchPattern) {
        qb.leftJoin(Member, "mover", "mover.id = m.mover_member_id")
          .leftJoin(Member, "seconder", "seconder.id = m.seconder_member_id")
          .andWhere(
            "(m.description ILIKE :searchPattern OR mover.name ILIKE :searchPattern OR seconder.name ILIKE :searchPattern OR CAST(mt.meeting_number AS TEXT) ILIKE :searchPattern)",
            { searchPattern }
          );
      }
      return qb;
    };

    const total = await baseQb().getCount();

    const rawRows = await baseQb()
      .select("m.id", "m_id")
      .addSelect("m.meeting_id", "m_meeting_id")
      .addSelect("m.description", "m_description")
      .addSelect("m.result", "m_result")
      .addSelect("m.order_index", "m_order_index")
      .addSelect("m.mover_member_id", "m_mover_member_id")
      .addSelect("m.seconder_member_id", "m_seconder_member_id")
      .addSelect("m.created_at", "m_created_at")
      .addSelect("mt.date", "meeting_date")
      .addSelect("mt.meeting_number", "meeting_number")
      .offset(skip)
      .limit(perPage)
      .getRawMany<{
        m_id: string;
        m_meeting_id: string;
        m_description: string | null;
        m_result: string;
        m_order_index: number;
        m_mover_member_id: string | null;
        m_seconder_member_id: string | null;
        m_created_at: Date | string | null;
        meeting_date: Date | string;
        meeting_number: number;
      }>();

    const motionMemberIds = [...new Set([
      ...rawRows.map((r) => r.m_mover_member_id).filter(Boolean),
      ...rawRows.map((r) => r.m_seconder_member_id).filter(Boolean),
    ] as string[])];
    const membersMap = new Map<string, string>();
    if (motionMemberIds.length > 0) {
      const members = await this.ds.getRepository(Member).find({
        where: { id: In(motionMemberIds) },
        select: ["id", "name"],
      });
      for (const m of members) membersMap.set(m.id, m.name);
    }

    const items = rawRows.map((r) => {
      const meetingDate = r.meeting_date;
      const meetingDateStr =
        meetingDate instanceof Date
          ? meetingDate.toISOString().slice(0, 10)
          : typeof meetingDate === "string"
            ? meetingDate.slice(0, 10)
            : "";
      return {
        id: r.m_id,
        meeting_id: r.m_meeting_id,
        description: r.m_description ?? null,
        result: r.m_result as MotionResult,
        order_index: r.m_order_index,
        mover_member_id: r.m_mover_member_id ?? null,
        seconder_member_id: r.m_seconder_member_id ?? null,
        mover_name: r.m_mover_member_id ? membersMap.get(r.m_mover_member_id) ?? null : null,
        seconder_name: r.m_seconder_member_id ? membersMap.get(r.m_seconder_member_id) ?? null : null,
        created_at: toISOString(r.m_created_at),
        meeting_date: meetingDateStr,
        meeting_number: r.meeting_number,
      };
    });

    return { items, total };
  }

  async listOldBusiness() {
    const items = await this.ds.getRepository(OldBusinessItem).find({
      order: { orderIndex: "ASC", createdAt: "ASC" },
    });
    if (items.length === 0) return [];
    const meetingIds = [...new Set(items.map((ob) => ob.meetingId))];
    const meetings = await this.ds.getRepository(Meeting).find({
      where: { id: In(meetingIds) },
      select: ["id", "date", "meetingNumber"],
    });
    const meetingMap = new Map(meetings.map((m) => [m.id, m]));
    return items.map((ob) => {
      const meeting = meetingMap.get(ob.meetingId);
      return {
        id: ob.id,
        meeting_id: ob.meetingId,
        description: ob.description,
        status: ob.status as OldBusinessStatus,
        closed_at: toISOStringOrNull(ob.closedAt),
        closed_in_meeting_id: ob.closedInMeetingId ?? null,
        order_index: ob.orderIndex,
        created_at: toISOString(ob.createdAt),
        meeting_number: meeting?.meetingNumber,
        meeting_date: meeting?.date ? meeting.date.toISOString().slice(0, 10) : undefined,
      };
    });
  }

  private async fetchDocumentsForMeetings(meetings: Meeting[]): Promise<Map<string, Document>> {
    const docIds = [
      ...meetings.map((m) => m.agendaDocumentId),
      ...meetings.map((m) => m.minutesDocumentId).filter((id): id is string => id != null),
    ];
    if (docIds.length === 0) return new Map();
    const docs = await this.ds.getRepository(Document).find({ where: { id: In(docIds) } });
    return new Map(docs.map((d) => [d.id, d]));
  }

  private async getMotionCountsByMeetingId(meetingIds: string[]): Promise<Map<string, number>> {
    if (meetingIds.length === 0) return new Map();
    const rows = await this.ds.getRepository(MeetingMotion)
      .createQueryBuilder("m")
      .select("m.meeting_id", "meeting_id")
      .addSelect("COUNT(*)", "count")
      .where("m.meeting_id IN (:...ids)", { ids: meetingIds })
      .groupBy("m.meeting_id")
      .getRawMany<{ meeting_id: string; count: string }>();
    return new Map(rows.map((r) => [r.meeting_id, parseInt(r.count, 10)]));
  }

  private meetingToApi(m: Meeting, docMap: Map<string, Document>) {
    const agendaDoc = docMap.get(m.agendaDocumentId);
    const minutesDoc = m.minutesDocumentId ? docMap.get(m.minutesDocumentId) : null;
    const dateStr =
      m.date instanceof Date ? m.date.toISOString().slice(0, 10) : (m.date as string);
    return {
      id: m.id,
      date: dateStr,
      meeting_number: m.meetingNumber,
      location: m.location ?? null,
      start_time: toISOStringOrNull(m.startTime),
      end_time: toISOStringOrNull(m.endTime),
      video_conference_url: m.videoConferenceUrl ?? null,
      previous_meeting_id: m.previousMeetingId ?? null,
      agenda_document_id: m.agendaDocumentId,
      minutes_document_id: m.minutesDocumentId ?? null,
      agenda_content: agendaDoc?.content ?? EMPTY_DOC,
      minutes_content: minutesDoc?.content ?? null,
      created_at: toISOString(m.createdAt),
      updated_at: toISOString(m.updatedAt),
    };
  }
}
