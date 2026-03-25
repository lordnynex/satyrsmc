import { keepPreviousData } from "@tanstack/react-query";
import { trpc } from "@/trpc";
import type { MemberEventListInput } from "@satyrsmc/shared/dto/member/event";

export function useMemberEventsList(input: MemberEventListInput) {
  return trpc.members.events.list.useQuery(input, {
    placeholderData: keepPreviousData,
  });
}

export function useMemberEventDetail(id: string) {
  return trpc.members.events.get.useQuery({ id });
}

export function useMemberEventRsvp() {
  const utils = trpc.useUtils();
  return trpc.members.events.rsvp.useMutation({
    onSuccess: () => {
      utils.members.events.list.invalidate();
      utils.members.events.get.invalidate();
      utils.members.rsvps.getMyRsvps.invalidate();
    },
  });
}

/** Cancel an RSVP via the registration system. */
export function useMemberRsvpCancel() {
  const utils = trpc.useUtils();
  return trpc.members.rsvps.cancel.useMutation({
    onSuccess: () => {
      utils.members.events.list.invalidate();
      utils.members.events.get.invalidate();
      utils.members.rsvps.getMyRsvps.invalidate();
    },
  });
}
