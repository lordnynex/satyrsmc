import type { MigrationInterface } from "typeorm";
import type { QueryRunner } from "typeorm";

/**
 * Adds qr_codes table for storing configurable QR codes with generated images.
 */
export class AddQrCodesTable1740000003000 implements MigrationInterface {
  name = "AddQrCodesTable1740000003000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS qr_codes (
        id TEXT PRIMARY KEY,
        name TEXT,
        url TEXT NOT NULL,
        config TEXT,
        image_data BLOB,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE IF EXISTS qr_codes");
  }
}
