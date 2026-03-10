import type { MigrationInterface } from "typeorm";
import type { QueryRunner } from "typeorm";

/**
 * Adds contact_emergency_contacts table for emergency contacts associated with contacts.
 * One contact can have one or more emergency contacts.
 */
export class AddContactEmergencyContactsTable1740000005000 implements MigrationInterface {
  name = "AddContactEmergencyContactsTable1740000005000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS contact_emergency_contacts (
        id TEXT PRIMARY KEY,
        contact_id TEXT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        relationship TEXT,
        FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_contact_emergency_contacts_contact_id ON contact_emergency_contacts(contact_id)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE IF EXISTS contact_emergency_contacts");
  }
}
