import type { TrpcClient } from "../trpc";
import type { EventAssignmentCategory, EventType } from "../../lib/enums";
import { fileToBase64 } from "./utils";

export class EventsApiClient {
  constructor(private client: TrpcClient) {}

  list(opts?: { type?: EventType }) {
    return this.client.admin.events.list.query(opts?.type ? { type: opts.type } : undefined);
  }

  get(id: string) {
    return this.client.admin.events.get.query({ id });
  }

  create(body: Record<string, unknown>) {
    return this.client.admin.events.create.mutate(body as never);
  }

  update(id: string, body: Record<string, unknown>) {
    return this.client.admin.events.update.mutate({ id, ...body } as never);
  }

  delete(id: string) {
    return this.client.admin.events.delete.mutate({ id });
  }

  readonly photos = {
    add: async (eventId: string, file: File) => {
      const imageBase64 = await fileToBase64(file);
      return this.client.admin.events.addPhoto.mutate({ eventId, imageBase64 });
    },
    delete: async (eventId: string, photoId: string) =>
      this.client.admin.events.deletePhoto.mutate({ eventId, photoId }),
  };

  readonly assets = {
    add: async (eventId: string, file: File) => {
      const imageBase64 = await fileToBase64(file);
      return this.client.admin.events.addAsset.mutate({ eventId, imageBase64 });
    },
    delete: async (eventId: string, assetId: string) =>
      this.client.admin.events.deleteAsset.mutate({ eventId, assetId }),
  };

  readonly attendees = {
    add: async (eventId: string, body: { contact_id: string; waiver_signed?: boolean }) =>
      this.client.admin.events.addAttendee.mutate({ eventId, ...body }),
    update: async (eventId: string, attendeeId: string, body: { waiver_signed?: boolean }) =>
      this.client.admin.events.updateAttendee.mutate({
        eventId,
        attendeeId,
        ...body,
      }),
    delete: async (eventId: string, attendeeId: string) =>
      this.client.admin.events.deleteAttendee.mutate({ eventId, attendeeId }),
  };

  readonly milestones = {
    create: async (
      eventId: string,
      body: {
        month: number;
        year: number;
        description: string;
        due_date?: string;
      },
    ) => this.client.admin.events.createMilestone.mutate({ eventId, ...body }),
    update: async (
      eventId: string,
      mid: string,
      body: {
        month?: number;
        year?: number;
        description?: string;
        completed?: boolean;
        due_date?: string;
      },
    ) => this.client.admin.events.updateMilestone.mutate({ eventId, mid, ...body }),
    delete: async (eventId: string, mid: string) =>
      this.client.admin.events.deleteMilestone.mutate({ eventId, mid }),
    addMember: async (eventId: string, mid: string, memberId: string) =>
      this.client.admin.events.addMilestoneMember.mutate({
        eventId,
        mid,
        memberId,
      }),
    removeMember: async (eventId: string, mid: string, memberId: string) =>
      this.client.admin.events.removeMilestoneMember.mutate({
        eventId,
        mid,
        memberId,
      }),
  };

  readonly packingCategories = {
    create: async (eventId: string, body: { name: string }) =>
      this.client.admin.events.createPackingCategory.mutate({
        eventId,
        ...body,
      }),
    update: async (eventId: string, cid: string, body: { name?: string }) =>
      this.client.admin.events.updatePackingCategory.mutate({
        eventId,
        cid,
        ...body,
      }),
    delete: async (eventId: string, cid: string) =>
      this.client.admin.events.deletePackingCategory.mutate({ eventId, cid }),
  };

  readonly packingItems = {
    create: async (
      eventId: string,
      body: {
        category_id: string;
        name: string;
        quantity?: number;
        note?: string;
      },
    ) => this.client.admin.events.createPackingItem.mutate({ eventId, ...body }),
    update: async (
      eventId: string,
      pid: string,
      body: {
        category_id?: string;
        name?: string;
        quantity?: number;
        note?: string;
        loaded?: boolean;
      },
    ) =>
      this.client.admin.events.updatePackingItem.mutate({
        eventId,
        pid,
        ...body,
      }),
    delete: async (eventId: string, pid: string) =>
      this.client.admin.events.deletePackingItem.mutate({ eventId, pid }),
  };

  readonly assignments = {
    create: async (eventId: string, body: { name: string; category: EventAssignmentCategory }) =>
      this.client.admin.events.createAssignment.mutate({ eventId, ...body }),
    update: async (
      eventId: string,
      aid: string,
      body: { name?: string; category?: EventAssignmentCategory },
    ) =>
      this.client.admin.events.updateAssignment.mutate({
        eventId,
        aid,
        ...body,
      }),
    delete: async (eventId: string, aid: string) =>
      this.client.admin.events.deleteAssignment.mutate({ eventId, aid }),
    addMember: async (eventId: string, aid: string, memberId: string) =>
      this.client.admin.events.addAssignmentMember.mutate({
        eventId,
        aid,
        memberId,
      }),
    removeMember: async (eventId: string, aid: string, memberId: string) =>
      this.client.admin.events.removeAssignmentMember.mutate({
        eventId,
        aid,
        memberId,
      }),
  };

  readonly volunteers = {
    create: async (eventId: string, body: { name: string; department: string }) =>
      this.client.admin.events.createVolunteer.mutate({ eventId, ...body }),
    update: async (eventId: string, vid: string, body: { name?: string; department?: string }) =>
      this.client.admin.events.updateVolunteer.mutate({
        eventId,
        vid,
        ...body,
      }),
    delete: async (eventId: string, vid: string) =>
      this.client.admin.events.deleteVolunteer.mutate({ eventId, vid }),
  };

  readonly scheduleItems = {
    create: async (
      eventId: string,
      body: {
        scheduled_time: string;
        label: string;
        location?: string;
      },
    ) => this.client.admin.events.createScheduleItem.mutate({ eventId, ...body }),
    update: async (
      eventId: string,
      scheduleId: string,
      body: {
        scheduled_time?: string;
        label?: string;
        location?: string | null;
      },
    ) =>
      this.client.admin.events.updateScheduleItem.mutate({
        eventId,
        scheduleId,
        ...body,
      }),
    delete: async (eventId: string, scheduleId: string) =>
      this.client.admin.events.deleteScheduleItem.mutate({
        eventId,
        scheduleId,
      }),
  };

  readonly incidents = {
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
      },
    ) =>
      this.client.admin.events.createIncident.mutate({
        eventId,
        ...body,
      }),
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
      },
    ) =>
      this.client.admin.events.updateIncident.mutate({
        eventId,
        incidentId,
        ...body,
      }),
    delete: async (eventId: string, incidentId: string) =>
      this.client.admin.events.deleteIncident.mutate({
        eventId,
        incidentId,
      }),
  };

  readonly memberAttendees = {
    add: async (eventId: string, body: { member_id: string; waiver_signed?: boolean }) =>
      this.client.admin.events.addMemberAttendee.mutate({ eventId, ...body }),
  };
}
