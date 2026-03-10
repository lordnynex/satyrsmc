import type { MigrationInterface } from "typeorm";
import type { QueryRunner } from "typeorm";

/**
 * Adds hellenic (boolean) and deceased (boolean) + deceased_year (integer) columns to contacts.
 */
export class AddContactHellenicDeceased1740000004000 implements MigrationInterface {
  name = "AddContactHellenicDeceased1740000004000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE contacts ADD COLUMN hellenic INTEGER DEFAULT 0
    `);
    await queryRunner.query(`
      ALTER TABLE contacts ADD COLUMN deceased INTEGER DEFAULT 0
    `);
    await queryRunner.query(`
      ALTER TABLE contacts ADD COLUMN deceased_year INTEGER
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE contacts DROP COLUMN hellenic`);
    await queryRunner.query(`ALTER TABLE contacts DROP COLUMN deceased`);
    await queryRunner.query(`ALTER TABLE contacts DROP COLUMN deceased_year`);
  }
}
