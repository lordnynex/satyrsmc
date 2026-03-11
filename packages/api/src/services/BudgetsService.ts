import type { DataSource } from "typeorm";
import type { DbLike } from "../db/dbAdapter";
import { Budget, LineItem } from "../entities";
import { uuid } from "./utils";
import { toISOString } from "../lib/date";
import type {
  BudgetAddLineItemOutput,
  BudgetCreateOutput,
  BudgetDeleteOutput,
  BudgetDeleteLineItemOutput,
  BudgetGetOutput,
  BudgetListOutput,
  BudgetUpdateOutput,
  BudgetUpdateLineItemOutput,
} from "@satyrsmc/shared/dto/admin/budget";

export class BudgetsService {
  constructor(
    private db: DbLike,
    private ds: DataSource,
  ) {}

  async list(): Promise<BudgetListOutput> {
    /* Original: SELECT * FROM budgets ORDER BY year DESC, name */
    const entities = await this.ds.getRepository(Budget).find({
      order: { year: "DESC", name: "ASC" },
    });
    return entities.map((e) => ({
      id: e.id,
      name: e.name,
      year: e.year,
      description: e.description,
      created_at: toISOString(e.createdAt) ?? "",
    }));
  }

  async get(id: string): Promise<BudgetGetOutput | null> {
    /* Original: SELECT * FROM budgets WHERE id = ? */
    const budget = await this.ds.getRepository(Budget).findOne({ where: { id } });
    if (!budget) return null;
    /* Original: SELECT * FROM line_items WHERE budget_id = ? ORDER BY name */
    const items = await this.ds.getRepository(LineItem).find({
      where: { budgetId: id },
      order: { name: "ASC" },
    });
    return {
      id: budget.id,
      name: budget.name,
      year: budget.year,
      description: budget.description,
      created_at: toISOString(budget.createdAt) ?? "",
      lineItems: items.map((i) => ({
        id: i.id,
        name: i.name,
        category: i.category,
        comments: i.comments ?? undefined,
        unitCost: i.unitCost,
        quantity: i.quantity,
        historicalCosts: i.historicalCosts ? JSON.parse(i.historicalCosts) : undefined,
      })),
    };
  }

  async create(body: {
    name: string;
    year: number;
    description?: string;
  }): Promise<BudgetCreateOutput | null> {
    const id = uuid();
    await this.db.run("INSERT INTO budgets (id, name, year, description) VALUES (?, ?, ?, ?)", [
      id,
      body.name,
      body.year,
      body.description ?? null,
    ]);
    return { id, ...body, lineItems: [] };
  }

  async update(
    id: string,
    body: { name?: string; year?: number; description?: string },
  ): Promise<BudgetUpdateOutput | null> {
    /* Original: SELECT * FROM budgets WHERE id = ? */
    const existing = await this.ds.getRepository(Budget).findOne({ where: { id } });
    if (!existing) return null;
    const name = body.name ?? existing.name;
    const year = body.year ?? existing.year;
    const description = body.description !== undefined ? body.description : existing.description;
    await this.db.run("UPDATE budgets SET name = ?, year = ?, description = ? WHERE id = ?", [
      name,
      year,
      description,
      id,
    ]);
    return { id, name, year, description, lineItems: [] };
  }

  async delete(id: string): Promise<BudgetDeleteOutput> {
    await this.db.run("DELETE FROM line_items WHERE budget_id = ?", [id]);
    await this.db.run("DELETE FROM budgets WHERE id = ?", [id]);
    return { ok: true as const };
  }

  async addLineItem(
    budgetId: string,
    body: {
      name: string;
      category: string;
      comments?: string;
      unitCost: number;
      quantity: number;
      historicalCosts?: Record<string, number>;
    },
  ): Promise<BudgetAddLineItemOutput> {
    const itemId = uuid();
    await this.db.run(
      "INSERT INTO line_items (id, budget_id, name, category, comments, unit_cost, quantity, historical_costs) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        itemId,
        budgetId,
        body.name,
        body.category,
        body.comments ?? null,
        body.unitCost,
        body.quantity,
        body.historicalCosts ? JSON.stringify(body.historicalCosts) : null,
      ],
    );
    return {
      id: itemId,
      ...body,
    };
  }

  async updateLineItem(
    budgetId: string,
    itemId: string,
    body: Partial<{
      name: string;
      category: string;
      comments: string;
      unitCost: number;
      quantity: number;
      historicalCosts: Record<string, number>;
    }>,
  ): Promise<BudgetUpdateLineItemOutput | null> {
    /* Original: SELECT * FROM line_items WHERE id = ? AND budget_id = ? */
    const existing = await this.ds.getRepository(LineItem).findOne({
      where: { id: itemId, budgetId },
    });
    if (!existing) return null;
    const name = body.name ?? existing.name;
    const category = body.category ?? existing.category;
    const comments = body.comments !== undefined ? body.comments : existing.comments;
    const unitCost = body.unitCost ?? existing.unitCost;
    const quantity = body.quantity ?? existing.quantity;
    const historicalCosts =
      body.historicalCosts !== undefined
        ? JSON.stringify(body.historicalCosts)
        : existing.historicalCosts;
    await this.db.run(
      "UPDATE line_items SET name = ?, category = ?, comments = ?, unit_cost = ?, quantity = ?, historical_costs = ? WHERE id = ? AND budget_id = ?",
      [name, category, comments, unitCost, quantity, historicalCosts, itemId, budgetId],
    );
    return {
      id: itemId,
      name,
      category,
      comments,
      unitCost,
      quantity,
      historicalCosts: historicalCosts
        ? (JSON.parse(historicalCosts) as Record<string, number>)
        : undefined,
    };
  }

  async deleteLineItem(budgetId: string, itemId: string): Promise<BudgetDeleteLineItemOutput> {
    await this.db.run("DELETE FROM line_items WHERE id = ? AND budget_id = ?", [itemId, budgetId]);
    return { ok: true as const };
  }
}
