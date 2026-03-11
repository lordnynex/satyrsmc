import type { TrpcClient } from "../trpc";

export class ScenariosApiClient {
  constructor(private client: TrpcClient) {}

  list() {
    return this.client.admin.scenarios.list.query();
  }

  get(id: string) {
    return this.client.admin.scenarios.get.query({ id });
  }

  create(body: {
    name: string;
    description?: string;
    inputs?: Record<string, unknown>;
  }) {
    return this.client.admin.scenarios.create.mutate(body as never);
  }

  update(
    id: string,
    body: {
      name?: string;
      description?: string;
      inputs?: Record<string, unknown>;
    }
  ) {
    return this.client.admin.scenarios.update.mutate({ id, ...body } as never);
  }

  delete(id: string) {
    return this.client.admin.scenarios.delete.mutate({ id });
  }
}
