import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddIncidents1740000020000 implements MigrationInterface {
  name = "AddIncidents1740000020000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS incidents (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        contact_id TEXT NULL,
        member_id TEXT NULL,
        type TEXT NOT NULL,
        severity TEXT NOT NULL,
        summary TEXT NOT NULL,
        details TEXT NULL,
        occurred_at TEXT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
        FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
        FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_incidents_event_id ON incidents(event_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_incidents_contact_id ON incidents(contact_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_incidents_member_id ON incidents(member_id)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE IF EXISTS incidents");
  }
}

