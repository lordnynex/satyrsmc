import { In } from "typeorm";
import type { DataSource } from "typeorm";
import {
  Committee,
  CommitteeMember,
  CommitteeMeeting,
  Document,
  Member,
  MeetingTemplate,
} from "../entities";
import type { CommitteeStatus } from "@satyrsmc/shared/lib/enums";
import { uuid } from "./utils";
import { toISOString, toISOStringOrNull } from "../lib/date";
import type {
  CommitteeAddMemberOutput,
  CommitteeCreateMeetingOutput,
  CommitteeCreateOutput,
  CommitteeGetMeetingOutput,
  CommitteeGetOutput,
  CommitteeListMeetingsOutput,
  CommitteeListOutput,
  CommitteeRemoveMemberOutput,
  CommitteeReorderMembersOutput,
  CommitteeUpdateMeetingOutput,
  CommitteeUpdateOutput,
} from "@satyrsmc/shared/dto/admin/committee";

const EMPTY_DOC = JSON.stringify({ type: "doc", content: [{ type: "paragraph" }] });

export class CommitteesService {
  constructor(private ds: DataSource) {}

  async list(sort?: "formed_date" | "name"): Promise<CommitteeListOutput> {
    const repo = this.ds.getRepository(Committee);
    const order: Record<string, "ASC" | "DESC"> =
      sort === "name"
        ? { name: "ASC" }
        : { formedDate: "DESC" };
    const entities = await repo.find({ order });
    const committeeIds = entities.map((c) => c.id);
    const [memberCounts, meetingCounts] = await Promise.all([
      this.getMemberCountsByCommitteeId(committeeIds),
      this.getMeetingCountsByCommitteeId(committeeIds),
    ]);
    return entities.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description ?? null,
      purpose: c.purpose ?? null,
      formed_date: toISOString(c.formedDate),
      closed_date: toISOStringOrNull(c.closedDate),
      chairperson_member_id: c.chairpersonMemberId ?? null,
      status: c.status as CommitteeStatus,
      created_at: toISOString(c.createdAt),
      updated_at: toISOString(c.updatedAt),
      member_count: memberCounts.get(c.id) ?? 0,
      meeting_count: meetingCounts.get(c.id) ?? 0,
    }));
  }

  async get(id: string): Promise<CommitteeGetOutput | null> {
    const committee = await this.ds.getRepository(Committee).findOne({ where: { id } });
    if (!committee) return null;
    const members = await this.ds.getRepository(CommitteeMember).find({
      where: { committeeId: id },
      order: { sortOrder: "ASC", id: "ASC" },
    });
    const meetings = await this.ds.getRepository(CommitteeMeeting).find({
      where: { committeeId: id },
      order: { date: "DESC", meetingNumber: "DESC" },
    });
    const memberIds = [...new Set(members.map((m) => m.memberId))];
    const membersMap = new Map<string, string>();
    if (memberIds.length) {
      const memberEntities = await this.ds.getRepository(Member).find({
        where: { id: In(memberIds) },
        select: ["id", "name"],
      });
      for (const m of memberEntities) membersMap.set(m.id, m.name);
    }
    const chairpersonName = committee.chairpersonMemberId
      ? membersMap.get(committee.chairpersonMemberId) ?? null
      : null;
    const docMap = await this.fetchDocumentsForCommitteeMeetings(meetings);
    return {
      id: committee.id,
      name: committee.name,
      description: committee.description ?? null,
      purpose: committee.purpose ?? null,
      formed_date: toISOString(committee.formedDate),
      closed_date: toISOStringOrNull(committee.closedDate),
      chairperson_member_id: committee.chairpersonMemberId ?? null,
      chairperson_name: chairpersonName,
      status: committee.status as CommitteeStatus,
      created_at: toISOString(committee.createdAt),
      updated_at: toISOString(committee.updatedAt),
      members: members.map((m) => ({
        id: m.id,
        committee_id: m.committeeId,
        member_id: m.memberId,
        member_name: membersMap.get(m.memberId) ?? null,
        sort_order: m.sortOrder,
      })),
      meetings: meetings.map((cm) => this.committeeMeetingToApi(cm, docMap)),
    };
  }

  async create(body: {
    name: string;
    description?: string | null;
    purpose?: string | null;
    formed_date: string;
    chairperson_member_id?: string | null;
    member_ids?: string[];
  }): Promise<CommitteeCreateOutput | null> {
    const now = new Date().toISOString();
    const committee = this.ds.getRepository(Committee).create({
      id: uuid(),
      name: body.name,
      description: body.description ?? null,
      purpose: body.purpose ?? null,
      formedDate: body.formed_date,
      closedDate: null,
      chairpersonMemberId: body.chairperson_member_id ?? null,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
    await this.ds.getRepository(Committee).save(committee);
    const memberIds = body.member_ids ?? [];
    for (let i = 0; i < memberIds.length; i++) {
      const cm = this.ds.getRepository(CommitteeMember).create({
        id: uuid(),
        committeeId: committee.id,
        memberId: memberIds[i]!,
        sortOrder: i,
      });
      await this.ds.getRepository(CommitteeMember).save(cm);
    }
    return this.get(committee.id)!;
  }

  async update(id: string, body: Record<string, unknown>): Promise<CommitteeUpdateOutput | null> {
    const committee = await this.ds.getRepository(Committee).findOne({ where: { id } });
    if (!committee) return null;
    const updates: Partial<Committee> = {};
    if (body.name !== undefined) updates.name = body.name as string;
    if (body.description !== undefined) updates.description = body.description as string | null;
    if (body.purpose !== undefined) updates.purpose = body.purpose as string | null;
    if (body.formed_date !== undefined) updates.formedDate = new Date(body.formed_date as string);
    if (body.closed_date !== undefined) updates.closedDate = body.closed_date != null ? new Date(body.closed_date as string) : null;
    if (body.chairperson_member_id !== undefined) updates.chairpersonMemberId = body.chairperson_member_id as string | null;
    if (body.status !== undefined) updates.status = body.status as CommitteeStatus;
    updates.updatedAt = new Date();
    await this.ds.getRepository(Committee).update(id, updates);
    return this.get(id);
  }

  async delete(id: string) {
    const committee = await this.ds.getRepository(Committee).findOne({ where: { id } });
    if (!committee) return false;
    const meetings = await this.ds.getRepository(CommitteeMeeting).find({
      where: { committeeId: id },
    });
    const docIds: string[] = [];
    for (const m of meetings) {
      docIds.push(m.agendaDocumentId);
      if (m.minutesDocumentId) docIds.push(m.minutesDocumentId);
    }
    if (docIds.length) {
      await this.ds.getRepository(Document).delete(docIds);
    }
    const result = await this.ds.getRepository(Committee).delete(id);
    return result.affected !== 0;
  }

  async addMember(committeeId: string, memberId: string): Promise<CommitteeAddMemberOutput | null> {
    const committee = await this.ds.getRepository(Committee).findOne({ where: { id: committeeId } });
    if (!committee) return null;
    const existing = await this.ds.getRepository(CommitteeMember).findOne({
      where: { committeeId, memberId },
    });
    if (existing) return this.get(committeeId);
    const maxResult = await this.ds.getRepository(CommitteeMember)
      .createQueryBuilder("cm")
      .select("COALESCE(MAX(cm.sortOrder), -1)", "m")
      .where("cm.committeeId = :committeeId", { committeeId })
      .getRawOne<{ m: number }>();
    const cm = this.ds.getRepository(CommitteeMember).create({
      id: uuid(),
      committeeId,
      memberId,
      sortOrder: (maxResult?.m ?? -1) + 1,
    });
    await this.ds.getRepository(CommitteeMember).save(cm);
    return this.get(committeeId);
  }

  async removeMember(committeeId: string, memberId: string): Promise<CommitteeRemoveMemberOutput | null> {
    const result = await this.ds.getRepository(CommitteeMember).delete({
      committeeId,
      memberId,
    });
    if (result.affected === 0) return null;
    return this.get(committeeId);
  }

  async updateMemberOrder(committeeId: string, memberIds: string[]): Promise<CommitteeReorderMembersOutput | null> {
    const committee = await this.ds.getRepository(Committee).findOne({ where: { id: committeeId } });
    if (!committee) return null;
    for (let i = 0; i < memberIds.length; i++) {
      await this.ds.getRepository(CommitteeMember).update(
        { committeeId, memberId: memberIds[i]! },
        { sortOrder: i }
      );
    }
    return this.get(committeeId);
  }

  async listMeetings(committeeId: string): Promise<CommitteeListMeetingsOutput | null> {
    const committee = await this.ds.getRepository(Committee).findOne({ where: { id: committeeId } });
    if (!committee) return null;
    const meetings = await this.ds.getRepository(CommitteeMeeting).find({
      where: { committeeId },
      order: { date: "DESC", meetingNumber: "DESC" },
    });
    const docMap = await this.fetchDocumentsForCommitteeMeetings(meetings);
    return meetings.map((m) => this.committeeMeetingToApi(m, docMap));
  }

  async createMeeting(committeeId: string, body: {
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
  }): Promise<CommitteeCreateMeetingOutput | null> {
    const committee = await this.ds.getRepository(Committee).findOne({ where: { id: committeeId } });
    if (!committee) return null;
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
    const meeting = this.ds.getRepository(CommitteeMeeting).create({
      id: uuid(),
      committeeId,
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
    await this.ds.getRepository(CommitteeMeeting).save(meeting);
    const docMap = new Map<string, Document>([
      [agendaDoc.id, agendaDoc],
      [minutesDoc.id, minutesDoc],
    ]);
    return this.committeeMeetingToApi(meeting, docMap);
  }

  async getMeeting(committeeId: string, meetingId: string): Promise<CommitteeGetMeetingOutput | null> {
    const meeting = await this.ds.getRepository(CommitteeMeeting).findOne({
      where: { id: meetingId, committeeId },
    });
    if (!meeting) return null;
    const docMap = await this.fetchDocumentsForCommitteeMeetings([meeting]);
    return {
      ...this.committeeMeetingToApi(meeting, docMap),
      committee_id: meeting.committeeId,
    };
  }

  async updateMeeting(committeeId: string, meetingId: string, body: Record<string, unknown>): Promise<CommitteeUpdateMeetingOutput | null> {
    const meeting = await this.ds.getRepository(CommitteeMeeting).findOne({
      where: { id: meetingId, committeeId },
    });
    if (!meeting) return null;
    const updates: Partial<CommitteeMeeting> = {};
    if (body.date !== undefined) updates.date = new Date(body.date as string);
    if (body.meeting_number !== undefined) updates.meetingNumber = body.meeting_number as number;
    if (body.location !== undefined) updates.location = body.location as string | null;
    if (body.start_time !== undefined) updates.startTime = body.start_time != null ? new Date(body.start_time as string) : null;
    if (body.end_time !== undefined) updates.endTime = body.end_time != null ? new Date(body.end_time as string) : null;
    if (body.video_conference_url !== undefined) updates.videoConferenceUrl = body.video_conference_url as string | null;
    if (body.previous_meeting_id !== undefined) updates.previousMeetingId = body.previous_meeting_id as string | null;
    updates.updatedAt = new Date();
    await this.ds.getRepository(CommitteeMeeting).update(meetingId, updates);
    const updated = await this.ds.getRepository(CommitteeMeeting).findOne({ where: { id: meetingId } });
    if (!updated) return null;
    const docMap = await this.fetchDocumentsForCommitteeMeetings([updated]);
    return { ...this.committeeMeetingToApi(updated, docMap), committee_id: updated.committeeId };
  }

  async deleteMeeting(committeeId: string, meetingId: string) {
    const meeting = await this.ds.getRepository(CommitteeMeeting).findOne({
      where: { id: meetingId, committeeId },
    });
    if (!meeting) return false;
    await this.ds.getRepository(Document).delete([meeting.agendaDocumentId]);
    if (meeting.minutesDocumentId) {
      await this.ds.getRepository(Document).delete([meeting.minutesDocumentId]);
    }
    const result = await this.ds.getRepository(CommitteeMeeting).delete({ id: meetingId, committeeId });
    return result.affected !== 0;
  }

  private async getMemberCountsByCommitteeId(committeeIds: string[]): Promise<Map<string, number>> {
    if (committeeIds.length === 0) return new Map();
    const rows = await this.ds.getRepository(CommitteeMember)
      .createQueryBuilder("cm")
      .select("cm.committee_id", "committee_id")
      .addSelect("COUNT(*)", "count")
      .where("cm.committee_id IN (:...ids)", { ids: committeeIds })
      .groupBy("cm.committee_id")
      .getRawMany<{ committee_id: string; count: string }>();
    return new Map(rows.map((r) => [r.committee_id, parseInt(r.count, 10)]));
  }

  private async getMeetingCountsByCommitteeId(committeeIds: string[]): Promise<Map<string, number>> {
    if (committeeIds.length === 0) return new Map();
    const rows = await this.ds.getRepository(CommitteeMeeting)
      .createQueryBuilder("cm")
      .select("cm.committee_id", "committee_id")
      .addSelect("COUNT(*)", "count")
      .where("cm.committee_id IN (:...ids)", { ids: committeeIds })
      .groupBy("cm.committee_id")
      .getRawMany<{ committee_id: string; count: string }>();
    return new Map(rows.map((r) => [r.committee_id, parseInt(r.count, 10)]));
  }

  private async fetchDocumentsForCommitteeMeetings(meetings: CommitteeMeeting[]): Promise<Map<string, Document>> {
    const docIds = [
      ...meetings.map((m) => m.agendaDocumentId),
      ...meetings.map((m) => m.minutesDocumentId).filter((id): id is string => id != null),
    ];
    if (docIds.length === 0) return new Map();
    const docs = await this.ds.getRepository(Document).find({ where: { id: In(docIds) } });
    return new Map(docs.map((d) => [d.id, d]));
  }

  private committeeMeetingToApi(m: CommitteeMeeting, docMap: Map<string, Document>): CommitteeGetMeetingOutput {
    const agendaDoc = docMap.get(m.agendaDocumentId);
    const minutesDoc = m.minutesDocumentId ? docMap.get(m.minutesDocumentId) : null;
    return {
      id: m.id,
      committee_id: m.committeeId,
      date: toISOString(m.date),
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
