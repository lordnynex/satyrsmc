import type { DataSource } from "typeorm";
import type { DbLike } from "../db/dbAdapter";
import { Scenario } from "../entities";
import { uuid, DEFAULT_SCENARIO_INPUTS } from "./utils";
import { toISOString } from "../lib/date";
import type {
  ScenarioCreateOutput,
  ScenarioDeleteOutput,
  ScenarioGetOutput,
  ScenarioListOutput,
  ScenarioUpdateOutput,
} from "@satyrsmc/shared/dto/admin/scenario";

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
      inputs: e.inputs,
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
      inputs: JSON.parse(entity.inputs),
      created_at: toISOString(entity.createdAt) ?? "",
    };
  }

  async create(body: {
    name: string;
    description?: string;
    inputs?: Record<string, unknown>;
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
    body: { name?: string; description?: string; inputs?: Record<string, unknown> },
  ): Promise<ScenarioUpdateOutput | null> {
    /* Original: SELECT * FROM scenarios WHERE id = ? */
    const existing = await this.ds.getRepository(Scenario).findOne({ where: { id } });
    if (!existing) return null;
    const name = body.name ?? existing.name;
    const description = body.description !== undefined ? body.description : existing.description;
    const inputs = body.inputs ?? JSON.parse(existing.inputs);
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
