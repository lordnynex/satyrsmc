import { keepPreviousData } from "@tanstack/react-query";
import { trpc } from "@/trpc";
import type { MemberEventListInput } from "@satyrsmc/shared/dto/member/event";

export function useMemberEventsList(input: MemberEventListInput) {
  return trpc.members.events.list.useQuery(input, {
    placeholderData: keepPreviousData,
  });
}

export function useMemberEventRsvp() {
  const utils = trpc.useUtils();
  return trpc.members.events.rsvp.useMutation({
    onSuccess: () => {
      utils.members.events.list.invalidate();
    },
  });
}
