import type { TrpcClient } from "../trpc";
import type { MailingList, ListPreview, MailingListStats } from "@satyrsmc/shared/dto/admin/mailingList";

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? "Request failed");
  }
  return res.json();
}

export class MailingListsApiClient {
  constructor(private client: TrpcClient) {}

  async list(): Promise<MailingList[]> {
    const data = await this.client.admin.mailingLists.list.query();
    return Array.isArray(data) ? data : [];
  }

  get(id: string): Promise<MailingList | null> {
    return this.client.admin.mailingLists.get
      .query({ id })
      .catch(() => null) as Promise<MailingList | null>;
  }

  create(body: Record<string, unknown>) {
    return this.client.admin.mailingLists.create.mutate(body as never);
  }

  update(id: string, body: Record<string, unknown>) {
    return this.client.admin.mailingLists.update.mutate({ id, ...body } as never);
  }

  delete(id: string) {
    return this.client.admin.mailingLists.delete.mutate({ id });
  }

  preview(id: string): Promise<ListPreview | null> {
    return this.client.admin.mailingLists.preview
      .query({ id })
      .catch(() => null) as Promise<ListPreview | null>;
  }

  getStats(id: string): Promise<MailingListStats | null> {
    return this.client.admin.mailingLists.getStats
      .query({ id })
      .catch(() => null) as Promise<MailingListStats | null>;
  }

  getIncluded(
    id: string,
    params?: { page?: number; limit?: number; q?: string }
  ) {
    return this.client.admin.mailingLists.getIncluded.query({
      listId: id,
      page: params?.page ?? 1,
      limit: params?.limit ?? 25,
      q: params?.q?.trim(),
    });
  }

  getMembers(listId: string) {
    return this.client.admin.mailingLists.getMembers.query({ listId });
  }

  addMember(listId: string, contactId: string) {
    return this.client.admin.mailingLists.addMember.mutate({
      listId,
      contactId,
    });
  }

  async addMembersBulk(
    listId: string,
    contactIds: string[],
    source?: "manual" | "import" | "rule"
  ) {
    return fetchJson<unknown>(`/api/mailing-lists/${listId}/members`, {
      method: "POST",
      body: JSON.stringify({
        contact_ids: contactIds,
        source: source ?? "manual",
      }),
    });
  }

  addAllContacts(listId: string) {
    return fetchJson<unknown>(
      `/api/mailing-lists/${listId}/members/add-all`,
      { method: "POST" }
    );
  }

  addAllHellenics(listId: string) {
    return fetchJson<unknown>(
      `/api/mailing-lists/${listId}/members/add-all-hellenics`,
      { method: "POST" }
    );
  }

  removeMember(listId: string, contactId: string) {
    return this.client.admin.mailingLists.removeMember.mutate({
      listId,
      contactId,
    });
  }

  reinstateMember(listId: string, contactId: string) {
    return fetchJson<unknown>(
      `/api/mailing-lists/${listId}/members/${contactId}/reinstate`,
      { method: "POST" }
    );
  }
}
