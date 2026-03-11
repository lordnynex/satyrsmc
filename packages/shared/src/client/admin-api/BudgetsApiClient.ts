import type { TrpcClient } from "../trpc";

export class BudgetsApiClient {
  constructor(private client: TrpcClient) {}

  list() {
    return this.client.admin.budgets.list.query();
  }

  get(id: string) {
    return this.client.admin.budgets.get.query({ id });
  }

  create(body: { name: string; year: number; description?: string }) {
    return this.client.admin.budgets.create.mutate(body);
  }

  update(id: string, body: { name?: string; year?: number; description?: string }) {
    return this.client.admin.budgets.update.mutate({ id, ...body } as never);
  }

  delete(id: string) {
    return this.client.admin.budgets.delete.mutate({ id });
  }

  addLineItem(budgetId: string, body: Record<string, unknown>) {
    return this.client.admin.budgets.addLineItem.mutate({
      budgetId,
      ...body,
    } as never);
  }

  updateLineItem(budgetId: string, itemId: string, body: Record<string, unknown>) {
    return this.client.admin.budgets.updateLineItem.mutate({
      budgetId,
      itemId,
      ...body,
    } as never);
  }

  deleteLineItem(budgetId: string, itemId: string) {
    return this.client.admin.budgets.deleteLineItem.mutate({
      budgetId,
      itemId,
    });
  }
}
