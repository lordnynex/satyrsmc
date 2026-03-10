import type { MigrationInterface } from "typeorm";
import type { QueryRunner } from "typeorm";

/**
 * Adds ok_to_sms consent column to contacts.
 */
export class AddContactOkToSms1740000006000 implements MigrationInterface {
  name = "AddContactOkToSms1740000006000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE contacts ADD COLUMN ok_to_sms TEXT CHECK (ok_to_sms IN ('yes', 'no', 'unknown')) DEFAULT 'unknown'
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE contacts DROP COLUMN ok_to_sms`);
  }
}
