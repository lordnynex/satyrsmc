import type { TrpcClient } from "../trpc";

export class MailingBatchesApiClient {
  constructor(private client: TrpcClient) {}

  list() {
    return this.client.admin.mailingBatches.list.query();
  }

  get(id: string) {
    return this.client.admin.mailingBatches.get.query({ id });
  }

  create(listId: string, name: string) {
    return this.client.admin.mailingBatches.create.mutate({ listId, name });
  }

  updateRecipientStatus(
    batchId: string,
    recipientId: string,
    status: string,
    reason?: string
  ) {
    return this.client.admin.mailingBatches.updateRecipientStatus.mutate({
      batchId,
      recipientId,
      status,
      reason,
    });
  }
}
