import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddEventRsvps1800000006000 implements MigrationInterface {
  name = "AddEventRsvps1800000006000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS event_rsvps (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'no_response',
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE(event_id, user_id)
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_event_rsvps_event_id ON event_rsvps(event_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_event_rsvps_user_id ON event_rsvps(user_id)`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE IF EXISTS event_rsvps");
  }
}
