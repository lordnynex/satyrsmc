import { trpc } from "@/trpc";
import type { Contact } from "@satyrsmc/shared/client";
import type { MeetingTemplate } from "@satyrsmc/shared/client";

/**
 * tRPC v11 useSuspenseQuery returns [data, queryResult]; older setups may return { data }.
 * Use this to get the procedure output from either shape.
 */
export function unwrapSuspenseData<T>(returnValue: [T, unknown] | { data?: T }): T | undefined {
  return Array.isArray(returnValue) ? returnValue[0] : (returnValue as { data?: T }).data;
}

/** Cache invalidation and optimistic updates (uses tRPC utils → TanStack Query) */
export function useInvalidateQueries() {
  const utils = trpc.useUtils();
  return {
    invalidateBudgets: () => utils.admin.budgets.list.invalidate(),
    invalidateBudget: (id: string) => utils.admin.budgets.get.invalidate({ id }),
    invalidateScenarios: () => utils.admin.scenarios.list.invalidate(),
    invalidateScenario: (id: string) =>
      utils.admin.scenarios.get.invalidate({ id }),
    invalidateEvents: () => utils.admin.events.list.invalidate(),
    invalidateEvent: (id: string) => utils.admin.events.get.invalidate({ id }),
    invalidateMembers: () => utils.admin.members.list.invalidate(),
    invalidateMember: (id: string) =>
      utils.admin.members.get.invalidate({ id }),
    invalidateContacts: () => utils.admin.contacts.list.invalidate(),
    invalidateContact: (id: string) =>
      utils.admin.contacts.get.invalidate({ id }),
    setContactData: (id: string, data: Contact) =>
      utils.admin.contacts.get.setData({ id }, data),
    invalidateMailingLists: () => utils.admin.mailingLists.list.invalidate(),
    invalidateMailingList: (id: string) => {
      utils.admin.mailingLists.get.invalidate({ id });
      utils.admin.mailingLists.preview.invalidate({ id });
      utils.admin.mailingLists.getStats.invalidate({ id });
      utils.admin.mailingLists.getIncluded.invalidate();
    },
    invalidateMailingBatches: () =>
      utils.admin.mailingBatches.list.invalidate(),
    invalidateMailingBatch: (id: string) =>
      utils.admin.mailingBatches.get.invalidate({ id }),
    invalidateQrCodes: () => utils.admin.qrCodes.list.invalidate(),
    invalidateQrCode: (id: string) =>
      utils.admin.qrCodes.get.invalidate({ id }),
    invalidateMeetings: () => utils.admin.meetings.list.invalidate(),
    invalidateMeeting: (id: string) =>
      utils.admin.meetings.get.invalidate({ id }),
    invalidateOldBusiness: () =>
      utils.admin.meetings.listOldBusiness.invalidate(),
    invalidateMeetingTemplates: () =>
      utils.admin.meetingTemplates.list.invalidate(),
    invalidateMeetingTemplate: (id: string) =>
      utils.admin.meetingTemplates.get.invalidate({ id }),
    setMeetingTemplateData: (id: string, data: MeetingTemplate) =>
      utils.admin.meetingTemplates.get.setData({ id }, data),
    invalidateCommittees: () => utils.admin.committees.list.invalidate(),
    invalidateCommittee: (id: string) =>
      utils.admin.committees.get.invalidate({ id }),
    invalidateCommitteeMeetings: (committeeId: string) =>
      utils.admin.committees.listMeetings.invalidate({ committeeId }),
    invalidateCommitteeMeeting: (committeeId: string, meetingId: string) =>
      utils.admin.committees.getMeeting.invalidate({
        committeeId,
        meetingId,
      }),
  };
}
