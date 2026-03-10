import type { MigrationInterface } from "typeorm";
import type { QueryRunner } from "typeorm";

/**
 * Adds ride-specific columns to events, and creates event_attendees,
 * event_assets, and ride_schedule_items tables.
 */
export class AddRideFieldsAndAttendeesAssets1740000008000 implements MigrationInterface {
  name = "AddRideFieldsAndAttendeesAssets1740000008000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE events ADD COLUMN start_location TEXT
    `);
    await queryRunner.query(`
      ALTER TABLE events ADD COLUMN end_location TEXT
    `);
    await queryRunner.query(`
      ALTER TABLE events ADD COLUMN facebook_event_url TEXT
    `);
    await queryRunner.query(`
      ALTER TABLE events ADD COLUMN pre_ride_event_id TEXT
    `);
    await queryRunner.query(`
      ALTER TABLE events ADD COLUMN ride_cost REAL
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS event_attendees (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        contact_id TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        waiver_signed INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
        FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_event_attendees_event_id ON event_attendees(event_id)
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS event_assets (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        photo BLOB,
        photo_thumbnail BLOB,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_event_assets_event_id ON event_assets(event_id)
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ride_schedule_items (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        scheduled_time TEXT NOT NULL,
        label TEXT NOT NULL,
        location TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_ride_schedule_items_event_id ON ride_schedule_items(event_id)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE IF EXISTS ride_schedule_items");
    await queryRunner.query("DROP TABLE IF EXISTS event_assets");
    await queryRunner.query("DROP TABLE IF EXISTS event_attendees");
    await queryRunner.query("ALTER TABLE events DROP COLUMN ride_cost");
    await queryRunner.query("ALTER TABLE events DROP COLUMN pre_ride_event_id");
    await queryRunner.query("ALTER TABLE events DROP COLUMN facebook_event_url");
    await queryRunner.query("ALTER TABLE events DROP COLUMN end_location");
    await queryRunner.query("ALTER TABLE events DROP COLUMN start_location");
  }
}
