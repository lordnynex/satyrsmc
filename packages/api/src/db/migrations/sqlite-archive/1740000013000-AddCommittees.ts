import type { MigrationInterface } from "typeorm";
import type { QueryRunner } from "typeorm";

/**
 * Adds committees, committee_members, and committee_meetings tables.
 */
export class AddCommittees1740000013000 implements MigrationInterface {
  name = "AddCommittees1740000013000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS committees (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        purpose TEXT,
        formed_date TEXT NOT NULL,
        closed_date TEXT,
        chairperson_member_id TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (chairperson_member_id) REFERENCES members(id) ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_committees_formed_date ON committees(formed_date)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_committees_status ON committees(status)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_committees_chairperson_member_id ON committees(chairperson_member_id)
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS committee_members (
        id TEXT PRIMARY KEY,
        committee_id TEXT NOT NULL,
        member_id TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (committee_id) REFERENCES committees(id) ON DELETE CASCADE,
        FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
        UNIQUE(committee_id, member_id)
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_committee_members_committee_id ON committee_members(committee_id)
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS committee_meetings (
        id TEXT PRIMARY KEY,
        committee_id TEXT NOT NULL,
        date TEXT NOT NULL,
        meeting_number INTEGER NOT NULL,
        location TEXT,
        previous_meeting_id TEXT,
        agenda_document_id TEXT NOT NULL,
        minutes_document_id TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (committee_id) REFERENCES committees(id) ON DELETE CASCADE,
        FOREIGN KEY (previous_meeting_id) REFERENCES committee_meetings(id) ON DELETE SET NULL,
        FOREIGN KEY (agenda_document_id) REFERENCES documents(id) ON DELETE CASCADE,
        FOREIGN KEY (minutes_document_id) REFERENCES documents(id) ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_committee_meetings_committee_id ON committee_meetings(committee_id)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_committee_meetings_date ON committee_meetings(date)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_committee_meetings_previous_meeting_id ON committee_meetings(previous_meeting_id)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE IF EXISTS committee_meetings");
    await queryRunner.query("DROP TABLE IF EXISTS committee_members");
    await queryRunner.query("DROP TABLE IF EXISTS committees");
  }
}
