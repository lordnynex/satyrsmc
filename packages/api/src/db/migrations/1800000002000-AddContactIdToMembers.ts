import type { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Adds a contact_id FK column to the members table, linking each member
 * to a Contact record as the canonical source of personal/contact info.
 */
export class AddContactIdToMembers1800000002000 implements MigrationInterface {
  name = "AddContactIdToMembers1800000002000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE members ADD COLUMN contact_id TEXT REFERENCES contacts(id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_members_contact_id ON members(contact_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_members_contact_id`);
    await queryRunner.query(`ALTER TABLE members DROP COLUMN IF EXISTS contact_id`);
  }
}
