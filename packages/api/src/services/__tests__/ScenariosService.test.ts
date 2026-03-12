import { describe, test, expect, beforeAll } from "bun:test";
import { setupTestDb } from "../../test/setup";
import type { Api } from "../api";
import type { DataSource } from "typeorm";
import type { DbLike } from "../../db/dbAdapter";
import { BAD_ID, createScenario } from "./helpers";
import { DEFAULT_SCENARIO_INPUTS } from "../utils";

describe("ScenariosService", () => {
  let api: Api;
  let _ds: DataSource;
  let db: DbLike;

  beforeAll(async () => {
    const result = await setupTestDb();
    api = result.api;
    _ds = result.ds;
    db = result.db;
  });

  describe("list", () => {
    test("returns created scenarios", async () => {
      const s = await createScenario(api, { name: "List Scenario" });
      if (!s) throw new Error("createScenario failed");
      const result = await api.scenarios.list();
      expect(result.some((e) => e.id === s.id)).toBe(true);
    });
  });

  describe("get", () => {
    test("returns scenario by id", async () => {
      const s = await createScenario(api, { name: "Get Scenario", description: "Desc" });
      if (!s) throw new Error("createScenario failed");
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
      const customInputs = {
        profitTarget: 5000,
        staffCount: 10,
        maxOccupancy: 100,
        complimentaryTickets: 5,
        dayPassPrice: 75,
        dayPassesSold: 10,
        ticketPrices: {
          proposedPrice1: 250,
          proposedPrice2: 300,
          proposedPrice3: 350,
          staffPrice1: 175,
          staffPrice2: 150,
          staffPrice3: 125,
        },
      };
      const s = await createScenario(api, { name: "With Inputs", inputs: customInputs });
      if (!s) throw new Error("createScenario failed");
      expect(s.id).toBeDefined();
      expect(s.inputs).toEqual(customInputs);
    });

    test("creates without inputs (default)", async () => {
      const s = await createScenario(api, { name: "No Inputs" });
      if (!s) throw new Error("createScenario failed");
      expect(s.inputs).toBeDefined();
    });
  });

  describe("update", () => {
    test("updates scenario", async () => {
      const s = await createScenario(api, { name: "Update Scenario" });
      if (!s) throw new Error("createScenario failed");
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
      if (!s) throw new Error("createScenario failed");
      await api.scenarios.delete(s.id);
      const got = await api.scenarios.get(s.id);
      expect(got).toBeNull();
    });
  });

  describe("safeParseInputs fallback", () => {
    test("returns defaults for invalid JSON in inputs column", async () => {
      const id = crypto.randomUUID();
      await db.run("INSERT INTO scenarios (id, name, inputs) VALUES (?, ?, ?)", [
        id,
        "Bad JSON",
        "not-valid-json{{{",
      ]);
      const got = await api.scenarios.get(id);
      expect(got).not.toBeNull();
      expect(got!.inputs).toEqual(DEFAULT_SCENARIO_INPUTS);
    });

    test("returns defaults for JSON that fails schema validation", async () => {
      const id = crypto.randomUUID();
      await db.run("INSERT INTO scenarios (id, name, inputs) VALUES (?, ?, ?)", [
        id,
        "Bad Schema",
        JSON.stringify({ foo: 1 }),
      ]);
      const got = await api.scenarios.get(id);
      expect(got).not.toBeNull();
      expect(got!.inputs).toEqual(DEFAULT_SCENARIO_INPUTS);
    });
  });
});
