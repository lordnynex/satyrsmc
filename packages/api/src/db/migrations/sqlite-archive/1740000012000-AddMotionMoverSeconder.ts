import type { MigrationInterface } from "typeorm";
import type { QueryRunner } from "typeorm";

/**
 * Adds mover_member_id and seconder_member_id to meeting_motions (Robert's Rules);
 * makes description optional (nullable).
 */
export class AddMotionMoverSeconder1740000012000 implements MigrationInterface {
  name = "AddMotionMoverSeconder1740000012000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE meeting_motions ADD COLUMN mover_member_id TEXT
    `);
    await queryRunner.query(`
      ALTER TABLE meeting_motions ADD COLUMN seconder_member_id TEXT
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_meeting_motions_mover_member_id ON meeting_motions(mover_member_id)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_meeting_motions_seconder_member_id ON meeting_motions(seconder_member_id)
    `);
    // SQLite does not support ALTER COLUMN; we leave description as NOT NULL for now
    // and allow empty string for "no description". Alternatively we could recreate the table.
    // Checking original: description TEXT NOT NULL. In SQLite we need to recreate table to change to NULL.
    // For minimal change: keep NOT NULL in DB but treat empty string as "no description" in app,
    // OR do a full table recreate. Let's do table recreate so we have proper nullable description.
    await queryRunner.query(`
      CREATE TABLE meeting_motions_new (
        id TEXT PRIMARY KEY,
        meeting_id TEXT NOT NULL,
        description TEXT,
        result TEXT NOT NULL,
        order_index INTEGER NOT NULL DEFAULT 0,
        mover_member_id TEXT,
        seconder_member_id TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
        FOREIGN KEY (mover_member_id) REFERENCES members(id) ON DELETE SET NULL,
        FOREIGN KEY (seconder_member_id) REFERENCES members(id) ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`
      INSERT INTO meeting_motions_new (id, meeting_id, description, result, order_index, mover_member_id, seconder_member_id, created_at)
      SELECT id, meeting_id, description, result, order_index, mover_member_id, seconder_member_id, created_at FROM meeting_motions
    `);
    await queryRunner.query(`DROP TABLE meeting_motions`);
    await queryRunner.query(`ALTER TABLE meeting_motions_new RENAME TO meeting_motions`);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_meeting_motions_meeting_id ON meeting_motions(meeting_id)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_meeting_motions_mover_member_id ON meeting_motions(mover_member_id)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_meeting_motions_seconder_member_id ON meeting_motions(seconder_member_id)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE meeting_motions_old (
        id TEXT PRIMARY KEY,
        meeting_id TEXT NOT NULL,
        description TEXT NOT NULL,
        result TEXT NOT NULL,
        order_index INTEGER NOT NULL DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      INSERT INTO meeting_motions_old (id, meeting_id, description, result, order_index, created_at)
      SELECT id, meeting_id, COALESCE(description, ''), result, order_index, created_at FROM meeting_motions
    `);
    await queryRunner.query(`DROP TABLE meeting_motions`);
    await queryRunner.query(`ALTER TABLE meeting_motions_old RENAME TO meeting_motions`);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_meeting_motions_meeting_id ON meeting_motions(meeting_id)
    `);
  }
}
