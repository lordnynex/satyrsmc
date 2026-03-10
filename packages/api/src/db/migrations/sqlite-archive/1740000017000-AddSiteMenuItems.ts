import type { MigrationInterface } from "typeorm";
import type { QueryRunner } from "typeorm";

/**
 * Adds site_menu_items table for website navigation menus.
 */
export class AddSiteMenuItems1740000017000 implements MigrationInterface {
  name = "AddSiteMenuItems1740000017000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS site_menu_items (
        id TEXT PRIMARY KEY,
        menu_key TEXT NOT NULL,
        label TEXT NOT NULL,
        url TEXT,
        internal_ref TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_site_menu_items_menu_key ON site_menu_items(menu_key)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE IF EXISTS site_menu_items");
  }
}
