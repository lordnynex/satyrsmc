import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/data/api";
import { trpc } from "@/trpc";
import { queryKeys } from "@/queries/keys";
import type { Contact, ContactSearchParams, MailingList, Tag } from "@satyrsmc/shared/client";

/** Data: { contacts: Contact[]; total: number; page: number; limit: number } */
export function useContactsSuspense(params?: ContactSearchParams) {
  return trpc.admin.contacts.list.useSuspenseQuery((params ?? {}) as Record<string, unknown>);
}

/** Data: { contacts: Contact[]; total: number; page: number; limit: number } */
export function useContactsOptional(
  params?: ContactSearchParams,
  options?: { enabled?: boolean }
) {
  return trpc.admin.contacts.list.useQuery((params ?? {}) as Record<string, unknown>, options);
}

/** Data: Contact */
export function useContactSuspense(id: string) {
  return trpc.admin.contacts.get.useSuspenseQuery({ id });
}

/** Data: Tag[] */
export function useContactTags() {
  return trpc.admin.contacts.listTags.useQuery();
}

export function useCreateContact() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Contact> & { display_name: string }) => api.contacts.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contacts"] }),
  });
}

export function useUpdateContact() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      api.contacts.update(id, body),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ predicate: (q) => (q.queryKey as unknown[])[0] === "contacts" });
      qc.invalidateQueries({ queryKey: queryKeys.contact(id) });
    },
  });
}

export function useDeleteContact() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.contacts.delete(id),
    onSuccess: () => qc.invalidateQueries({ predicate: (q) => (q.queryKey as unknown[])[0] === "contacts" }),
  });
}

export function useRestoreContact() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.contacts.restore(id),
    onSuccess: (_, id) => qc.invalidateQueries({ queryKey: queryKeys.contact(id) }),
  });
}

export function useContactsBulkUpdate() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      args: {
        ids: string[];
        updates: {
          tags?: (string | { id: string; name: string })[];
          status?: "active" | "inactive";
        };
      }
    ) => api.contacts.bulkUpdate(args.ids, args.updates),
    onSuccess: () =>
      qc.invalidateQueries({ predicate: (q) => (q.queryKey as unknown[])[0] === "contacts" }),
  });
}

export function useContactsListFetcher() {
  const api = useApi();
  return (params?: ContactSearchParams) => api.contacts.list(params);
}

/** Data: MailingList[] (lists that include this contact) */
export function useContactMailingLists(contactId: string | null) {
  const api = useApi();
  return useQuery({
    queryKey: ["contact", contactId, "mailingLists"],
    queryFn: async () => {
      if (!contactId) return [];
      const lists = await api.mailingLists.list();
      const withContact = await Promise.all(
        lists.map(async (l) => {
          const mems = await api.mailingLists.getMembers(l.id);
          return mems.some((m) => m.contact_id === contactId) ? l : null;
        })
      );
      return withContact.filter(Boolean) as Awaited<ReturnType<typeof api.mailingLists.list>>;
    },
    enabled: !!contactId,
  });
}

export function useContactNoteCreate() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ contactId, content }: { contactId: string; content: string }) =>
      api.contacts.notes.create(contactId, content),
    onSuccess: (_, { contactId }) =>
      qc.invalidateQueries({ queryKey: queryKeys.contact(contactId) }),
  });
}

export function useContactNoteUpdate() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      contactId,
      noteId,
      content,
    }: {
      contactId: string;
      noteId: string;
      content: string;
    }) => api.contacts.notes.update(contactId, noteId, content),
    onSuccess: (_, { contactId }) =>
      qc.invalidateQueries({ queryKey: queryKeys.contact(contactId) }),
  });
}

export function useContactNoteDelete() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ contactId, noteId }: { contactId: string; noteId: string }) =>
      api.contacts.notes.delete(contactId, noteId),
    onSuccess: (_, { contactId }) =>
      qc.invalidateQueries({ queryKey: queryKeys.contact(contactId) }),
  });
}

export function useContactPhotoAdd() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      contactId,
      file,
      options,
    }: {
      contactId: string;
      file: File;
      options?: { set_as_profile?: boolean };
    }) => api.contacts.photos.add(contactId, file, options),
    onSuccess: (_, { contactId }) =>
      qc.invalidateQueries({ queryKey: queryKeys.contact(contactId) }),
  });
}

export function useContactPhotoDelete() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ contactId, photoId }: { contactId: string; photoId: string }) =>
      api.contacts.photos.delete(contactId, photoId),
    onSuccess: (_, { contactId }) =>
      qc.invalidateQueries({ queryKey: queryKeys.contact(contactId) }),
  });
}

export function useContactPhotoSetProfile() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ contactId, photoId }: { contactId: string; photoId: string }) =>
      api.contacts.photos.setProfile(contactId, photoId),
    onSuccess: (_, { contactId }) =>
      qc.invalidateQueries({ queryKey: queryKeys.contact(contactId) }),
  });
}

export function useContactsImportPstPreview() {
  const api = useApi();
  return useMutation({
    mutationFn: (file: File) => api.contacts.importPstPreview(file),
  });
}

export function useContactsImportPstExecute() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      toCreate: Array<Record<string, unknown> & { display_name: string }>
    ) => api.contacts.importPstExecute(toCreate),
    onSuccess: () =>
      qc.invalidateQueries({ predicate: (q) => (q.queryKey as unknown[])[0] === "contacts" }),
  });
}
