import type { MigrationInterface } from "typeorm";
import type { QueryRunner } from "typeorm";

/**
 * Adds contact_submissions and contact_member_submissions tables.
 */
export class AddContactSubmissions1740000019000 implements MigrationInterface {
  name = "AddContactSubmissions1740000019000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS contact_submissions (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        subject TEXT,
        message TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'new',
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS contact_member_submissions (
        id TEXT PRIMARY KEY,
        member_id TEXT NOT NULL,
        sender_name TEXT NOT NULL,
        sender_email TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'new',
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE IF EXISTS contact_submissions");
    await queryRunner.query("DROP TABLE IF EXISTS contact_member_submissions");
  }
}
