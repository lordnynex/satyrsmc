import type { MigrationInterface } from "typeorm";
import type { QueryRunner } from "typeorm";

/**
 * Removes the audit_log table. Audit logging is no longer used.
 */
export class RemoveAuditLog1739900000000 implements MigrationInterface {
  name = "RemoveAuditLog1739900000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE IF EXISTS audit_log");
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id TEXT PRIMARY KEY,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT,
        user_id TEXT,
        details TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);
  }
}
