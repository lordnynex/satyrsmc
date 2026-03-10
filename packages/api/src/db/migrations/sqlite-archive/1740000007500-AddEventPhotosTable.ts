import type { MigrationInterface } from "typeorm";
import type { QueryRunner } from "typeorm";

/**
 * Adds event_photos table for photos taken at/after events.
 * Stores optimized blobs; future migration can add photo_url for disk/S3.
 */
export class AddEventPhotosTable1740000007500 implements MigrationInterface {
  name = "AddEventPhotosTable1740000007500";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS event_photos (
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
      CREATE INDEX IF NOT EXISTS idx_event_photos_event_id ON event_photos(event_id)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE IF EXISTS event_photos");
  }
}
