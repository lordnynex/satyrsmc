import type { TrpcClient } from "../trpc";

export class IncidentsApiClient {
  constructor(private client: TrpcClient) {}

  list(params: { page: number; per_page: number }) {
    return this.client.admin.incidents.list.query(params as never);
  }
}
