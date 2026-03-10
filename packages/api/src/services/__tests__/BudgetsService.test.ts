import { describe, test, expect, beforeAll } from "bun:test";
import { setupTestDb } from "../../test/setup";
import type { Api } from "../api";
import type { DataSource } from "typeorm";
import { BAD_ID, createBudget } from "./helpers";

describe("BudgetsService", () => {
  let api: Api;
  let ds: DataSource;

  beforeAll(async () => {
    const result = await setupTestDb();
    api = result.api;
    ds = result.ds;
  });

  describe("list", () => {
    test("returns created budgets", async () => {
      const b = await createBudget(api, { name: "List Budget" });
      const result = await api.budgets.list();
      expect(result.some((e) => e.id === b.id)).toBe(true);
    });
  });

  describe("get", () => {
    test("returns budget with line items", async () => {
      const budget = await createBudget(api, { name: "Get Budget" });
      const item = await api.budgets.addLineItem(budget.id, {
        name: "Item",
        category: "cat",
        unitCost: 10,
        quantity: 2,
      });
      const got = await api.budgets.get(budget.id);
      expect(got).not.toBeNull();
      expect(got!.lineItems.some((i) => i.id === item.id)).toBe(true);
    });

    test("get(badId) returns null", async () => {
      const result = await api.budgets.get(BAD_ID);
      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    test("creates budget", async () => {
      const b = await createBudget(api, { name: "New Budget", year: 2025 });
      expect(b.id).toBeDefined();
      expect(b.name).toBe("New Budget");
      expect(b.year).toBe(2025);
    });
  });

  describe("update", () => {
    test("updates budget", async () => {
      const b = await createBudget(api, { name: "Update Budget" });
      const updated = await api.budgets.update(b.id, { name: "Updated", description: "Desc" });
      expect(updated).not.toBeNull();
      expect(updated!.name).toBe("Updated");
      expect(updated!.description).toBe("Desc");
    });

    test("update(badId) returns null", async () => {
      const result = await api.budgets.update(BAD_ID, { name: "No" });
      expect(result).toBeNull();
    });
  });

  describe("delete", () => {
    test("deletes budget and line items", async () => {
      const b = await createBudget(api, { name: "Delete Budget" });
      await api.budgets.addLineItem(b.id, { name: "Li", category: "c", unitCost: 1, quantity: 1 });
      await api.budgets.delete(b.id);
      const got = await api.budgets.get(b.id);
      expect(got).toBeNull();
    });
  });

  describe("addLineItem", () => {
    test("adds line item", async () => {
      const budget = await createBudget(api, { name: "Add Item Budget" });
      const item = await api.budgets.addLineItem(budget.id, {
        name: "Line",
        category: "cat",
        unitCost: 5,
        quantity: 3,
        comments: "note",
      });
      expect(item.id).toBeDefined();
      expect(item.name).toBe("Line");
      expect(item.unitCost).toBe(5);
      expect(item.quantity).toBe(3);
    });
  });

  describe("updateLineItem", () => {
    test("updates line item", async () => {
      const budget = await createBudget(api, { name: "Upd Item Budget" });
      const item = await api.budgets.addLineItem(budget.id, {
        name: "Orig",
        category: "c",
        unitCost: 1,
        quantity: 1,
      });
      const updated = await api.budgets.updateLineItem(budget.id, item.id, { name: "NewName", quantity: 2 });
      expect(updated).not.toBeNull();
      expect(updated!.name).toBe("NewName");
      expect(updated!.quantity).toBe(2);
    });

    test("updateLineItem(budgetId, badItemId) returns null", async () => {
      const budget = await createBudget(api, { name: "Bad Item Budget" });
      const result = await api.budgets.updateLineItem(budget.id, BAD_ID, { name: "No" });
      expect(result).toBeNull();
    });
  });

  describe("deleteLineItem", () => {
    test("deletes line item", async () => {
      const budget = await createBudget(api, { name: "Del Item Budget" });
      const item = await api.budgets.addLineItem(budget.id, {
        name: "ToDel",
        category: "c",
        unitCost: 1,
        quantity: 1,
      });
      await api.budgets.deleteLineItem(budget.id, item.id);
      const got = await api.budgets.get(budget.id);
      expect(got!.lineItems.some((i) => i.id === item.id)).toBe(false);
    });
  });
});
