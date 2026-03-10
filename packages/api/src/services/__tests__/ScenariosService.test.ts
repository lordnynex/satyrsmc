import { describe, test, expect, beforeAll } from "bun:test";
import { setupTestDb } from "../../test/setup";
import type { Api } from "../api";
import type { DataSource } from "typeorm";
import { BAD_ID, createScenario } from "./helpers";

describe("ScenariosService", () => {
  let api: Api;
  let ds: DataSource;

  beforeAll(async () => {
    const result = await setupTestDb();
    api = result.api;
    ds = result.ds;
  });

  describe("list", () => {
    test("returns created scenarios", async () => {
      const s = await createScenario(api, { name: "List Scenario" });
      const result = await api.scenarios.list();
      expect(result.some((e) => e.id === s.id)).toBe(true);
    });
  });

  describe("get", () => {
    test("returns scenario by id", async () => {
      const s = await createScenario(api, { name: "Get Scenario", description: "Desc" });
      const got = await api.scenarios.get(s.id);
      expect(got).not.toBeNull();
      expect(got!.id).toBe(s.id);
      expect(got!.name).toBe("Get Scenario");
      expect(got!.description).toBe("Desc");
    });

    test("get(badId) returns null", async () => {
      const result = await api.scenarios.get(BAD_ID);
      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    test("creates with inputs", async () => {
      const s = await createScenario(api, { name: "With Inputs", inputs: { foo: 1 } });
      expect(s.id).toBeDefined();
      expect(s.inputs).toEqual({ foo: 1 });
    });

    test("creates without inputs (default)", async () => {
      const s = await createScenario(api, { name: "No Inputs" });
      expect(s.inputs).toBeDefined();
    });
  });

  describe("update", () => {
    test("updates scenario", async () => {
      const s = await createScenario(api, { name: "Update Scenario" });
      const updated = await api.scenarios.update(s.id, { name: "Updated", description: "D" });
      expect(updated).not.toBeNull();
      expect(updated!.name).toBe("Updated");
      expect(updated!.description).toBe("D");
    });

    test("update(badId) returns null", async () => {
      const result = await api.scenarios.update(BAD_ID, { name: "No" });
      expect(result).toBeNull();
    });
  });

  describe("delete", () => {
    test("deletes scenario", async () => {
      const s = await createScenario(api, { name: "Delete Scenario" });
      await api.scenarios.delete(s.id);
      const got = await api.scenarios.get(s.id);
      expect(got).toBeNull();
    });
  });
});
