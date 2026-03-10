import type { MigrationInterface } from "typeorm";
import type { QueryRunner } from "typeorm";

/**
 * Adds meetings, meeting_motions, meeting_action_items, old_business_items, and meeting_templates tables.
 */
export class AddMeetingsAndRelated1740000010000 implements MigrationInterface {
  name = "AddMeetingsAndRelated1740000010000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS meetings (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        meeting_number INTEGER NOT NULL,
        location TEXT,
        previous_meeting_id TEXT,
        agenda_content TEXT NOT NULL,
        minutes_content TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (previous_meeting_id) REFERENCES meetings(id) ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(date)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_meetings_previous_meeting_id ON meetings(previous_meeting_id)
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS meeting_motions (
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
      CREATE INDEX IF NOT EXISTS idx_meeting_motions_meeting_id ON meeting_motions(meeting_id)
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS meeting_action_items (
        id TEXT PRIMARY KEY,
        meeting_id TEXT NOT NULL,
        description TEXT NOT NULL,
        assignee_member_id TEXT,
        due_date TEXT,
        status TEXT NOT NULL DEFAULT 'open',
        completed_at TEXT,
        order_index INTEGER NOT NULL DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
        FOREIGN KEY (assignee_member_id) REFERENCES members(id) ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_meeting_action_items_meeting_id ON meeting_action_items(meeting_id)
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS old_business_items (
        id TEXT PRIMARY KEY,
        meeting_id TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open',
        closed_at TEXT,
        closed_in_meeting_id TEXT,
        order_index INTEGER NOT NULL DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
        FOREIGN KEY (closed_in_meeting_id) REFERENCES meetings(id) ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_old_business_items_meeting_id ON old_business_items(meeting_id)
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS meeting_templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_meeting_templates_type ON meeting_templates(type)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE IF EXISTS meeting_templates");
    await queryRunner.query("DROP TABLE IF EXISTS old_business_items");
    await queryRunner.query("DROP TABLE IF EXISTS meeting_action_items");
    await queryRunner.query("DROP TABLE IF EXISTS meeting_motions");
    await queryRunner.query("DROP TABLE IF EXISTS meetings");
  }
}
