import type { MigrationInterface } from "typeorm";
import type { QueryRunner } from "typeorm";

/**
 * Adds site_pages and site_settings tables for the website CMS.
 */
export class AddWebsiteTables1740000015000 implements MigrationInterface {
  name = "AddWebsiteTables1740000015000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS site_pages (
        id TEXT PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        meta_title TEXT,
        meta_description TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_site_pages_slug ON site_pages(slug)
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS site_settings (
        id TEXT PRIMARY KEY DEFAULT 'default',
        title TEXT,
        logo_url TEXT,
        footer_text TEXT,
        default_meta_description TEXT,
        contact_email TEXT,
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `);
    await queryRunner.query(`
      INSERT OR IGNORE INTO site_settings (id, title, updated_at) VALUES ('default', '', datetime('now'))
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE IF EXISTS site_pages");
    await queryRunner.query("DROP TABLE IF EXISTS site_settings");
  }
}
