import type { MigrationInterface } from "typeorm";
import type { QueryRunner } from "typeorm";

/**
 * Adds show_on_website to events and members for public website feed.
 */
export class AddShowOnWebsite1740000016000 implements MigrationInterface {
  name = "AddShowOnWebsite1740000016000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE events ADD COLUMN show_on_website INTEGER NOT NULL DEFAULT 0
    `);
    await queryRunner.query(`
      ALTER TABLE members ADD COLUMN show_on_website INTEGER NOT NULL DEFAULT 0
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE events DROP COLUMN show_on_website`);
    await queryRunner.query(`ALTER TABLE members DROP COLUMN show_on_website`);
  }
}
