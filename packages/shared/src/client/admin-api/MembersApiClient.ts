import type { TrpcClient } from "../trpc";
import type { Member } from "@satyrsmc/shared/dto/admin/member";

export type CreateMemberBody = {
  name: string;
  phone_number?: string;
  email?: string;
  address?: string;
  birthday?: string;
  member_since?: string;
  is_baby?: boolean;
  position?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  photo?: string;
};

export class MembersApiClient {
  constructor(private client: TrpcClient) {}

  list(): Promise<Member[]> {
    return this.client.admin.members.list.query();
  }

  get(id: string): Promise<Member> {
    return this.client.admin.members.get.query({ id });
  }

  create(body: CreateMemberBody) {
    return this.client.admin.members.create.mutate(body as never);
  }

  update(id: string, body: Record<string, unknown>) {
    return this.client.admin.members.update.mutate({ id, ...body } as never);
  }

  delete(id: string) {
    return this.client.admin.members.delete.mutate({ id });
  }

  async getPhoto(id: string, size?: string): Promise<Uint8Array | null> {
    const b64 = await this.client.admin.members.getPhoto.query({
      id,
      size: size as "thumbnail" | "medium" | "full",
    });
    return b64 ? new Uint8Array(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))) : null;
  }
}
