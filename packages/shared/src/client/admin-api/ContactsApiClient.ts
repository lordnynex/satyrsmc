import type { TrpcClient } from "../trpc";
import type {
  Contact,
  ContactSearchParams,
  ContactSearchResult,
  ContactPhoto,
} from "@satyrsmc/shared/dto/admin/contact";

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

export class ContactsApiClient {
  constructor(private client: TrpcClient) {}

  list(params?: ContactSearchParams): Promise<ContactSearchResult> {
    return this.client.admin.contacts.list.query(
      params as Record<string, unknown> | undefined
    ) as Promise<ContactSearchResult>;
  }

  get(id: string) {
    return this.client.admin.contacts.get.query({ id });
  }

  create(body: Partial<Contact> & { display_name: string }) {
    return this.client.admin.contacts.create.mutate(body as never);
  }

  update(id: string, body: Record<string, unknown>) {
    return this.client.admin.contacts.update.mutate({ id, ...body } as never);
  }

  delete(id: string) {
    return this.client.admin.contacts.delete.mutate({ id });
  }

  restore(id: string) {
    return this.client.admin.contacts.restore.mutate({ id });
  }

  async bulkUpdate(
    ids: string[],
    updates: {
      tags?: (string | { id: string; name: string })[];
      status?: "active" | "inactive";
    }
  ) {
    return fetchJson<Contact[]>(`/api/contacts/bulk-update`, {
      method: "POST",
      body: JSON.stringify({ ids, ...updates }),
    });
  }

  merge(
    sourceId: string,
    targetId: string,
    conflictResolution?: Record<string, "source" | "target">
  ) {
    return fetchJson<Contact>(`/api/contacts/merge`, {
      method: "POST",
      body: JSON.stringify({
        sourceId,
        targetId,
        conflictResolution,
      }),
    });
  }

  async importPstPreview(file: File) {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/contacts/import-pst", {
      method: "POST",
      body: form,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(
        (err as { error?: string }).error ?? "PST import failed"
      );
    }
    return res.json() as Promise<{
      contacts: Array<{
        payload: Record<string, unknown> & { display_name: string };
        status: string;
        existingContact?: { id: string; display_name: string };
      }>;
    }>;
  }

  importPstExecute(
    toCreate: Array<Record<string, unknown> & { display_name: string }>
  ) {
    return fetchJson<Contact[]>(`/api/contacts/import-pst-execute`, {
      method: "POST",
      body: JSON.stringify({ toCreate }),
    });
  }

  readonly tags = {
    list: () =>
      this.client.admin.contacts.listTags.query() as Promise<
        Array<{ id: string; name: string }>
      >,
    create: async (name: string) => {
      const res = await fetch("/api/contacts/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error((err as { error?: string }).error ?? "Request failed");
      }
      return res.json();
    },
  };

  readonly photos = {
    add: async (
      contactId: string,
      file: File,
      options?: {
        type?: "profile" | "contact";
        set_as_profile?: boolean;
      }
    ): Promise<ContactPhoto> => {
      const form = new FormData();
      form.append("file", file);
      if (options?.type) form.append("type", options.type);
      if (options?.set_as_profile !== undefined)
        form.append("set_as_profile", String(options.set_as_profile));
      const res = await fetch(`/api/contacts/${contactId}/photos`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error((err as { error?: string }).error ?? "Upload failed");
      }
      return res.json();
    },
    delete: async (contactId: string, photoId: string): Promise<void> => {
      const res = await fetch(
        `/api/contacts/${contactId}/photos/${photoId}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error((err as { error?: string }).error ?? "Delete failed");
      }
    },
    setProfile: async (
      contactId: string,
      photoId: string
    ): Promise<void> => {
      const res = await fetch(
        `/api/contacts/${contactId}/photos/${photoId}/set-profile`,
        { method: "POST" }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(
          (err as { error?: string }).error ?? "Set profile failed"
        );
      }
    },
  };

  readonly notes = {
    create: async (contactId: string, content: string) => {
      return fetchJson<{ id: string; content: string }>(
        `/api/contacts/${contactId}/notes`,
        {
          method: "POST",
          body: JSON.stringify({ content }),
        }
      );
    },
    update: async (
      contactId: string,
      noteId: string,
      content: string
    ) => {
      return fetchJson<{ id: string; content: string }>(
        `/api/contacts/${contactId}/notes/${noteId}`,
        {
          method: "PUT",
          body: JSON.stringify({ content }),
        }
      );
    },
    delete: async (contactId: string, noteId: string) => {
      const res = await fetch(
        `/api/contacts/${contactId}/notes/${noteId}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error((err as { error?: string }).error ?? "Request failed");
      }
    },
  };
}
