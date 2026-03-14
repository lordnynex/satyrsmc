import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/data/api";
import { trpc } from "@/trpc";
import { queryKeys } from "@/queries/keys";
import type { EventAssignmentCategory, EventType } from "@satyrsmc/shared/client";

/** Data: Event[] */
export function useEventsSuspense(type?: string) {
  return trpc.admin.events.list.useSuspenseQuery(type ? { type: type as EventType } : undefined);
}

/** Data: Event */
export function useEventSuspense(id: string) {
  return trpc.admin.events.get.useSuspenseQuery({ id });
}

/** Data: Event[] */
export function useEventsOptional(type?: string) {
  return trpc.admin.events.list.useQuery(type ? { type: type as EventType } : undefined);
}

// Mutations
export function useCreateEvent() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api.events.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.events() }),
  });
}

export function useUpdateEvent() {
  const api = useApi();
  const qc = useQueryClient();
  const utils = trpc.useUtils();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      api.events.update(id, body),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.events() });
      qc.invalidateQueries({ queryKey: queryKeys.event(id) });
      void utils.website.getEventsFeed.invalidate();
    },
  });
}

export function useDeleteEvent() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.events.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.events() }),
  });
}

export function useEventIncidentUpdate() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      incidentId,
      body,
    }: {
      eventId: string;
      incidentId: string;
      body: Record<string, unknown>;
    }) => api.events.incidents.update(eventId, incidentId, body),
    onSuccess: (_, { eventId }) => qc.invalidateQueries({ queryKey: queryKeys.event(eventId) }),
  });
}

export function useEventIncidentDelete() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, incidentId }: { eventId: string; incidentId: string }) =>
      api.events.incidents.delete(eventId, incidentId),
    onSuccess: (_, { eventId }) => qc.invalidateQueries({ queryKey: queryKeys.event(eventId) }),
  });
}

export function useIncidentsList(page: number, perPage: number) {
  const api = useApi();
  return useQuery({
    queryKey: ["incidents", page, perPage],
    queryFn: () => api.incidents.list({ page, per_page: perPage }),
  });
}

export function useEventIncidentCreate() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      body,
    }: {
      eventId: string;
      body: {
        type: string;
        severity: string;
        summary: string;
        details?: string;
        occurred_at?: string;
        contact_id?: string;
        member_id?: string;
      };
    }) => api.events.incidents.create(eventId, body),
    onSuccess: (_, { eventId }) => qc.invalidateQueries({ queryKey: queryKeys.event(eventId) }),
  });
}

export function useEventAttendeeAdd() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      body,
    }: {
      eventId: string;
      body: { contact_id: string; waiver_signed?: boolean };
    }) => api.events.attendees.add(eventId, body),
    onSuccess: (_, { eventId }) => qc.invalidateQueries({ queryKey: queryKeys.event(eventId) }),
  });
}

export function useEventAttendeeUpdate() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      attendeeId,
      body,
    }: {
      eventId: string;
      attendeeId: string;
      body: { waiver_signed?: boolean };
    }) => api.events.attendees.update(eventId, attendeeId, body),
    onSuccess: (_, { eventId }) => qc.invalidateQueries({ queryKey: queryKeys.event(eventId) }),
  });
}

export function useEventAttendeeDelete() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, attendeeId }: { eventId: string; attendeeId: string }) =>
      api.events.attendees.delete(eventId, attendeeId),
    onSuccess: (_, { eventId }) => qc.invalidateQueries({ queryKey: queryKeys.event(eventId) }),
  });
}

export function useEventMemberAttendeeAdd() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      body,
    }: {
      eventId: string;
      body: { member_id: string; waiver_signed?: boolean };
    }) => api.events.memberAttendees.add(eventId, body),
    onSuccess: (_, { eventId }) => qc.invalidateQueries({ queryKey: queryKeys.event(eventId) }),
  });
}

export function useEventScheduleItemCreate() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      body,
    }: {
      eventId: string;
      body: { scheduled_time: string; label: string; location?: string };
    }) => api.events.scheduleItems.create(eventId, body),
    onSuccess: (_, { eventId }) => qc.invalidateQueries({ queryKey: queryKeys.event(eventId) }),
  });
}

export function useEventScheduleItemUpdate() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      scheduleId,
      body,
    }: {
      eventId: string;
      scheduleId: string;
      body: Record<string, unknown>;
    }) => api.events.scheduleItems.update(eventId, scheduleId, body),
    onSuccess: (_, { eventId }) => qc.invalidateQueries({ queryKey: queryKeys.event(eventId) }),
  });
}

export function useEventScheduleItemDelete() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, scheduleId }: { eventId: string; scheduleId: string }) =>
      api.events.scheduleItems.delete(eventId, scheduleId),
    onSuccess: (_, { eventId }) => qc.invalidateQueries({ queryKey: queryKeys.event(eventId) }),
  });
}

export function useEventAssetAdd() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, file }: { eventId: string; file: File }) =>
      api.events.assets.add(eventId, file),
    onSuccess: (_, { eventId }) => qc.invalidateQueries({ queryKey: queryKeys.event(eventId) }),
  });
}

export function useEventAssetDelete() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, assetId }: { eventId: string; assetId: string }) =>
      api.events.assets.delete(eventId, assetId),
    onSuccess: (_, { eventId }) => qc.invalidateQueries({ queryKey: queryKeys.event(eventId) }),
  });
}

export function useEventMilestoneCreate() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      body,
    }: {
      eventId: string;
      body: { month: number; year: number; description: string; due_date?: string };
    }) => api.events.milestones.create(eventId, body),
    onSuccess: (_, { eventId }) => qc.invalidateQueries({ queryKey: queryKeys.event(eventId) }),
  });
}

export function useEventMilestoneUpdate() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      mid,
      body,
    }: {
      eventId: string;
      mid: string;
      body: Record<string, unknown>;
    }) => api.events.milestones.update(eventId, mid, body),
    onSuccess: (_, { eventId }) => qc.invalidateQueries({ queryKey: queryKeys.event(eventId) }),
  });
}

export function useEventMilestoneDelete() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, mid }: { eventId: string; mid: string }) =>
      api.events.milestones.delete(eventId, mid),
    onSuccess: (_, { eventId }) => qc.invalidateQueries({ queryKey: queryKeys.event(eventId) }),
  });
}

export function useEventMilestoneAddMember() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, mid, memberId }: { eventId: string; mid: string; memberId: string }) =>
      api.events.milestones.addMember(eventId, mid, memberId),
    onSuccess: (_, { eventId }) => qc.invalidateQueries({ queryKey: queryKeys.event(eventId) }),
  });
}

export function useEventMilestoneRemoveMember() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, mid, memberId }: { eventId: string; mid: string; memberId: string }) =>
      api.events.milestones.removeMember(eventId, mid, memberId),
    onSuccess: (_, { eventId }) => qc.invalidateQueries({ queryKey: queryKeys.event(eventId) }),
  });
}

export function useEventPackingCategoryCreate() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, body }: { eventId: string; body: { name: string } }) =>
      api.events.packingCategories.create(eventId, body),
    onSuccess: (_, { eventId }) => qc.invalidateQueries({ queryKey: queryKeys.event(eventId) }),
  });
}

export function useEventPackingItemCreate() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      body,
    }: {
      eventId: string;
      body: { category_id: string; name: string; quantity?: number; note?: string };
    }) => api.events.packingItems.create(eventId, body),
    onSuccess: (_, { eventId }) => qc.invalidateQueries({ queryKey: queryKeys.event(eventId) }),
  });
}

export function useEventPackingItemUpdate() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      pid,
      body,
    }: {
      eventId: string;
      pid: string;
      body: Record<string, unknown>;
    }) => api.events.packingItems.update(eventId, pid, body),
    onSuccess: (_, { eventId }) => qc.invalidateQueries({ queryKey: queryKeys.event(eventId) }),
  });
}

export function useEventPackingItemDelete() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, pid }: { eventId: string; pid: string }) =>
      api.events.packingItems.delete(eventId, pid),
    onSuccess: (_, { eventId }) => qc.invalidateQueries({ queryKey: queryKeys.event(eventId) }),
  });
}

export function useEventVolunteerCreate() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      body,
    }: {
      eventId: string;
      body: { name: string; department: string };
    }) => api.events.volunteers.create(eventId, body),
    onSuccess: (_, { eventId }) => qc.invalidateQueries({ queryKey: queryKeys.event(eventId) }),
  });
}

export function useEventVolunteerDelete() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, vid }: { eventId: string; vid: string }) =>
      api.events.volunteers.delete(eventId, vid),
    onSuccess: (_, { eventId }) => qc.invalidateQueries({ queryKey: queryKeys.event(eventId) }),
  });
}

export function useEventAssignmentCreate() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      body,
    }: {
      eventId: string;
      body: { name: string; category: EventAssignmentCategory };
    }) => api.events.assignments.create(eventId, body),
    onSuccess: (_, { eventId }) => qc.invalidateQueries({ queryKey: queryKeys.event(eventId) }),
  });
}

export function useEventAssignmentDelete() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, aid }: { eventId: string; aid: string }) =>
      api.events.assignments.delete(eventId, aid),
    onSuccess: (_, { eventId }) => qc.invalidateQueries({ queryKey: queryKeys.event(eventId) }),
  });
}

export function useEventAssignmentAddMember() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, aid, memberId }: { eventId: string; aid: string; memberId: string }) =>
      api.events.assignments.addMember(eventId, aid, memberId),
    onSuccess: (_, { eventId }) => qc.invalidateQueries({ queryKey: queryKeys.event(eventId) }),
  });
}

export function useEventAssignmentRemoveMember() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, aid, memberId }: { eventId: string; aid: string; memberId: string }) =>
      api.events.assignments.removeMember(eventId, aid, memberId),
    onSuccess: (_, { eventId }) => qc.invalidateQueries({ queryKey: queryKeys.event(eventId) }),
  });
}

export function useEventPhotoAdd() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, file }: { eventId: string; file: File }) =>
      api.events.photos.add(eventId, file),
    onSuccess: (_, { eventId }) => qc.invalidateQueries({ queryKey: queryKeys.event(eventId) }),
  });
}

export function useEventPhotoDelete() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, photoId }: { eventId: string; photoId: string }) =>
      api.events.photos.delete(eventId, photoId),
    onSuccess: (_, { eventId }) => qc.invalidateQueries({ queryKey: queryKeys.event(eventId) }),
  });
}
