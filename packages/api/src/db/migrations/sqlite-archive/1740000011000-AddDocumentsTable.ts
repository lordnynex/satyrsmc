import type { MigrationInterface } from "typeorm";
import type { QueryRunner } from "typeorm";
import { uuid } from "../../services/utils";

const EMPTY_DOC = JSON.stringify({ type: "doc", content: [{ type: "paragraph" }] });

/**
 * Adds documents table, document_versions table, migrates meetings and meeting_templates
 * to use document FKs instead of inline content.
 */
export class AddDocumentsTable1740000011000 implements MigrationInterface {
  name = "AddDocumentsTable1740000011000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS document_versions (
        id TEXT PRIMARY KEY,
        document_id TEXT NOT NULL,
        content TEXT NOT NULL,
        version_number INTEGER NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
        UNIQUE(document_id, version_number)
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON document_versions(document_id)
    `);

    await queryRunner.query("PRAGMA foreign_keys=OFF");

    const meetings = (await queryRunner.query("SELECT * FROM meetings")) as Array<{
      id: string;
      date: string;
      meeting_number: number;
      location: string | null;
      previous_meeting_id: string | null;
      agenda_content: string;
      minutes_content: string | null;
      created_at: string | null;
      updated_at: string | null;
    }>;

    const now = new Date().toISOString();

    await queryRunner.query(`
      CREATE TABLE meetings_new (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        meeting_number INTEGER NOT NULL,
        location TEXT,
        previous_meeting_id TEXT,
        agenda_document_id TEXT NOT NULL,
        minutes_document_id TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (previous_meeting_id) REFERENCES meetings(id) ON DELETE SET NULL,
        FOREIGN KEY (agenda_document_id) REFERENCES documents(id) ON DELETE CASCADE,
        FOREIGN KEY (minutes_document_id) REFERENCES documents(id) ON DELETE SET NULL
      )
    `);

    for (const m of meetings) {
      const agendaId = uuid();
      const minutesId = uuid();
      await queryRunner.query(
        `INSERT INTO documents (id, content, created_at, updated_at) VALUES (?, ?, ?, ?)`,
        [agendaId, m.agenda_content ?? EMPTY_DOC, m.created_at ?? now, m.updated_at ?? now]
      );
      await queryRunner.query(
        `INSERT INTO documents (id, content, created_at, updated_at) VALUES (?, ?, ?, ?)`,
        [minutesId, m.minutes_content ?? EMPTY_DOC, m.created_at ?? now, m.updated_at ?? now]
      );
      await queryRunner.query(
        `INSERT INTO meetings_new (id, date, meeting_number, location, previous_meeting_id, agenda_document_id, minutes_document_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          m.id,
          m.date,
          m.meeting_number,
          m.location,
          m.previous_meeting_id,
          agendaId,
          minutesId,
          m.created_at ?? now,
          m.updated_at ?? now,
        ]
      );
    }

    await queryRunner.query("DROP TABLE meetings");
    await queryRunner.query("ALTER TABLE meetings_new RENAME TO meetings");
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(date)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_meetings_previous_meeting_id ON meetings(previous_meeting_id)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_meetings_agenda_document_id ON meetings(agenda_document_id)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_meetings_minutes_document_id ON meetings(minutes_document_id)
    `);

    const templates = (await queryRunner.query("SELECT * FROM meeting_templates")) as Array<{
      id: string;
      name: string;
      type: string;
      content: string;
      created_at: string | null;
      updated_at: string | null;
    }>;

    await queryRunner.query(`
      CREATE TABLE meeting_templates_new (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        document_id TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
      )
    `);

    for (const t of templates) {
      const docId = uuid();
      await queryRunner.query(
        `INSERT INTO documents (id, content, created_at, updated_at) VALUES (?, ?, ?, ?)`,
        [docId, t.content ?? EMPTY_DOC, t.created_at ?? now, t.updated_at ?? now]
      );
      await queryRunner.query(
        `INSERT INTO meeting_templates_new (id, name, type, document_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
        [t.id, t.name, t.type, docId, t.created_at ?? now, t.updated_at ?? now]
      );
    }

    await queryRunner.query("DROP TABLE meeting_templates");
    await queryRunner.query("ALTER TABLE meeting_templates_new RENAME TO meeting_templates");
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_meeting_templates_type ON meeting_templates(type)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_meeting_templates_document_id ON meeting_templates(document_id)
    `);

    await queryRunner.query("PRAGMA foreign_keys=ON");
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("PRAGMA foreign_keys=OFF");

    await queryRunner.query(`
      CREATE TABLE meetings_old (
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

    const docs = (await queryRunner.query("SELECT * FROM documents")) as Array<{
      id: string;
      content: string;
    }>;
    const docMap = new Map(docs.map((d) => [d.id, d.content]));

    const meetings = (await queryRunner.query("SELECT * FROM meetings")) as Array<{
      id: string;
      date: string;
      meeting_number: number;
      location: string | null;
      previous_meeting_id: string | null;
      agenda_document_id: string;
      minutes_document_id: string | null;
      created_at: string | null;
      updated_at: string | null;
    }>;

    for (const m of meetings) {
      const agendaContent = docMap.get(m.agenda_document_id) ?? EMPTY_DOC;
      const minutesContent = m.minutes_document_id ? docMap.get(m.minutes_document_id) ?? null : null;
      await queryRunner.query(
        `INSERT INTO meetings_old (id, date, meeting_number, location, previous_meeting_id, agenda_content, minutes_content, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          m.id,
          m.date,
          m.meeting_number,
          m.location,
          m.previous_meeting_id,
          agendaContent,
          minutesContent,
          m.created_at,
          m.updated_at,
        ]
      );
    }

    await queryRunner.query("DROP TABLE meetings");
    await queryRunner.query("ALTER TABLE meetings_old RENAME TO meetings");
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(date)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_meetings_previous_meeting_id ON meetings(previous_meeting_id)
    `);

    await queryRunner.query(`
      CREATE TABLE meeting_templates_old (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `);

    const templates = (await queryRunner.query("SELECT * FROM meeting_templates")) as Array<{
      id: string;
      name: string;
      type: string;
      document_id: string;
      created_at: string | null;
      updated_at: string | null;
    }>;

    for (const t of templates) {
      const content = docMap.get(t.document_id) ?? EMPTY_DOC;
      await queryRunner.query(
        `INSERT INTO meeting_templates_old (id, name, type, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
        [t.id, t.name, t.type, content, t.created_at, t.updated_at]
      );
    }

    await queryRunner.query("DROP TABLE meeting_templates");
    await queryRunner.query("ALTER TABLE meeting_templates_old RENAME TO meeting_templates");
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_meeting_templates_type ON meeting_templates(type)
    `);

    await queryRunner.query("DROP TABLE IF EXISTS document_versions");
    await queryRunner.query("DROP TABLE IF EXISTS documents");
    await queryRunner.query("PRAGMA foreign_keys=ON");
  }
}
