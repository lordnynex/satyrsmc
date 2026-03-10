import type { MigrationInterface } from "typeorm";
import type { QueryRunner } from "typeorm";

/**
 * Adds contact_photos table for multiple photos per contact.
 * Supports profile (main) and contact (additional) photo types.
 */
export class AddContactPhotosTable1740000002000 implements MigrationInterface {
  name = "AddContactPhotosTable1740000002000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS contact_photos (
        id TEXT PRIMARY KEY,
        contact_id TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'contact',
        sort_order INTEGER NOT NULL DEFAULT 0,
        photo BLOB,
        photo_thumbnail BLOB,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_contact_photos_contact_id ON contact_photos(contact_id)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE IF EXISTS contact_photos");
  }
}
