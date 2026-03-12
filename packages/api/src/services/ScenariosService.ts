import type { DataSource } from "typeorm";
import type { DbLike } from "../db/dbAdapter";
import { Scenario } from "../entities";
import { uuid, DEFAULT_SCENARIO_INPUTS } from "./utils";
import { toISOString } from "../lib/date";
import {
  ScenarioInputsSchema,
  type ScenarioInputs,
  type ScenarioCreateOutput,
  type ScenarioDeleteOutput,
  type ScenarioGetOutput,
  type ScenarioListOutput,
  type ScenarioUpdateOutput,
} from "@satyrsmc/shared/dto/admin/scenario";

function safeParseInputs(raw: string): ScenarioInputs {
  try {
    return ScenarioInputsSchema.parse(JSON.parse(raw));
  } catch {
    return DEFAULT_SCENARIO_INPUTS as ScenarioInputs;
  }
}

export class ScenariosService {
  constructor(
    private db: DbLike,
    private ds: DataSource,
  ) {}

  async list(): Promise<ScenarioListOutput> {
    /* Original: SELECT * FROM scenarios ORDER BY name */
    const entities = await this.ds.getRepository(Scenario).find({ order: { name: "ASC" } });
    return entities.map((e) => ({
      id: e.id,
      name: e.name,
      description: e.description,
      inputs: safeParseInputs(e.inputs),
      created_at: toISOString(e.createdAt) ?? "",
    }));
  }

  async get(id: string): Promise<ScenarioGetOutput | null> {
    /* Original: SELECT * FROM scenarios WHERE id = ? */
    const entity = await this.ds.getRepository(Scenario).findOne({ where: { id } });
    if (!entity) return null;
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      inputs: safeParseInputs(entity.inputs),
      created_at: toISOString(entity.createdAt) ?? "",
    };
  }

  async create(body: {
    name: string;
    description?: string;
    inputs?: ScenarioInputs;
  }): Promise<ScenarioCreateOutput> {
    const id = uuid();
    const inputs = body.inputs ?? DEFAULT_SCENARIO_INPUTS;
    await this.db.run("INSERT INTO scenarios (id, name, description, inputs) VALUES (?, ?, ?, ?)", [
      id,
      body.name,
      body.description ?? null,
      JSON.stringify(inputs),
    ]);
    return { id, name: body.name, description: body.description, inputs };
  }

  async update(
    id: string,
    body: { name?: string; description?: string; inputs?: ScenarioInputs },
  ): Promise<ScenarioUpdateOutput | null> {
    /* Original: SELECT * FROM scenarios WHERE id = ? */
    const existing = await this.ds.getRepository(Scenario).findOne({ where: { id } });
    if (!existing) return null;
    const name = body.name ?? existing.name;
    const description = body.description !== undefined ? body.description : existing.description;
    const inputs = body.inputs ?? safeParseInputs(existing.inputs);
    await this.db.run("UPDATE scenarios SET name = ?, description = ?, inputs = ? WHERE id = ?", [
      name,
      description,
      JSON.stringify(inputs),
      id,
    ]);
    return { id, name, description, inputs };
  }

  async delete(id: string): Promise<ScenarioDeleteOutput> {
    await this.db.run("DELETE FROM scenarios WHERE id = ?", [id]);
    return { ok: true as const };
  }
}
