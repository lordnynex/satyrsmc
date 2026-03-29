/**
 * Unit tests for admin.budgets tRPC router.
 * Covers list, get, create, update, delete, addLineItem, updateLineItem, deleteLineItem.
 */

import type { TRPCError } from "@trpc/server";
import { describe, test, expect, beforeAll } from "vitest";
import type { TrpcTestHarness } from "../../../test/trpcHarness";
import { createTrpcTestHarness } from "../../../test/trpcHarness";
import { BAD_ID, createBudget } from "../helpers";

describe("admin.budgets", () => {
  let harness: TrpcTestHarness;

  beforeAll(async () => {
    harness = await createTrpcTestHarness();
  });

  describe("list", () => {
    test("returns created budgets", async () => {
      const b = (await createBudget(harness.api, { name: "Budget List", year: 2025 }))!;
      const result = await harness.caller.admin.budgets.list();
      expect(Array.isArray(result)).toBe(true);
      expect(result.some((x) => x.id === b.id)).toBe(true);
    });
  });

  describe("get", () => {
    test("returns budget by id", async () => {
      const b = (await createBudget(harness.api, { name: "Get Budget", year: 2025 }))!;
      const result = await harness.caller.admin.budgets.get({ id: b.id });
      expect(result.id).toBe(b.id);
      expect(result.name).toBe("Get Budget");
    });

    test("throws NOT_FOUND when id does not exist", async () => {
      try {
        await harness.caller.admin.budgets.get({ id: BAD_ID });
      } catch (e) {
        expect((e as TRPCError).code).toBe("NOT_FOUND");
      }
    });
  });

  describe("create", () => {
    test("creates budget and returns it", async () => {
      const result = await harness.caller.admin.budgets.create({
        name: "New Budget",
        year: 2026,
      });
      expect(result.id).toBeDefined();
      expect(result.name).toBe("New Budget");
      expect(result.year).toBe(2026);
    });
  });

  describe("update", () => {
    test("updates budget and returns it", async () => {
      const b = (await createBudget(harness.api, { name: "To Update", year: 2025 }))!;
      const result = await harness.caller.admin.budgets.update({
        id: b.id,
        name: "Updated Budget",
      });
      expect(result.id).toBe(b.id);
      expect(result.name).toBe("Updated Budget");
    });

    test("throws NOT_FOUND when id does not exist", async () => {
      try {
        await harness.caller.admin.budgets.update({ id: BAD_ID, name: "No" });
      } catch (e) {
        expect((e as TRPCError).code).toBe("NOT_FOUND");
      }
    });
  });

  describe("delete", () => {
    test("deletes budget and returns ok", async () => {
      const b = (await createBudget(harness.api, { name: "To Delete", year: 2025 }))!;
      const result = await harness.caller.admin.budgets.delete({ id: b.id });
      expect(result.ok).toBe(true);
      const list = await harness.caller.admin.budgets.list();
      expect(list.some((x) => x.id === b.id)).toBe(false);
    });
  });

  describe("addLineItem", () => {
    test("adds line item to budget", async () => {
      const b = (await createBudget(harness.api, { name: "With Line", year: 2025 }))!;
      const result = await harness.caller.admin.budgets.addLineItem({
        budgetId: b.id,
        name: "Item",
        category: "Cat",
        unitCost: 10,
        quantity: 2,
      });
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe("Item");
    });
  });

  describe("updateLineItem", () => {
    test("updates line item and returns updated line item", async () => {
      const b = (await createBudget(harness.api, { name: "Update Item", year: 2025 }))!;
      const added = await harness.caller.admin.budgets.addLineItem({
        budgetId: b.id,
        name: "Line",
        category: "C",
        unitCost: 5,
        quantity: 1,
      });
      const result = await harness.caller.admin.budgets.updateLineItem({
        budgetId: b.id,
        itemId: added.id,
        name: "Updated Line",
      });
      expect(result).toBeDefined();
      expect(result.name).toBe("Updated Line");
      expect(result.id).toBe(added.id);
    });

    test("throws NOT_FOUND when itemId does not exist", async () => {
      const b = (await createBudget(harness.api, { name: "Bad Item", year: 2025 }))!;
      try {
        await harness.caller.admin.budgets.updateLineItem({
          budgetId: b.id,
          itemId: BAD_ID,
          name: "No",
        });
      } catch (e) {
        expect((e as TRPCError).code).toBe("NOT_FOUND");
      }
    });
  });

  describe("deleteLineItem", () => {
    test("deletes line item", async () => {
      const b = (await createBudget(harness.api, { name: "Del Item", year: 2025 }))!;
      const added = await harness.caller.admin.budgets.addLineItem({
        budgetId: b.id,
        name: "To Del",
        category: "C",
        unitCost: 1,
        quantity: 1,
      });
      await harness.caller.admin.budgets.deleteLineItem({
        budgetId: b.id,
        itemId: added.id,
      });
      const got = await harness.caller.admin.budgets.get({ id: b.id });
      expect(got.lineItems?.some((li) => li.id === added.id)).toBe(false);
    });
  });
});
