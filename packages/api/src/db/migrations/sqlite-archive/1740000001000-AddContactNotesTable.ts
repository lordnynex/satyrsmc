import type { MigrationInterface } from "typeorm";
import type { QueryRunner } from "typeorm";

/**
 * Adds contact_notes table for free-form attachable notes per contact.
 * Migrates existing contact.notes content into the new table.
 */
export class AddContactNotesTable1740000001000 implements MigrationInterface {
  name = "AddContactNotesTable1740000001000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS contact_notes (
        id TEXT PRIMARY KEY,
        contact_id TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_contact_notes_contact_id ON contact_notes(contact_id)
    `);

    // Migrate existing notes from contacts to contact_notes
    const rows = await queryRunner.query(
      `SELECT id, notes, created_at FROM contacts WHERE notes IS NOT NULL AND notes != ''`
    ) as Array<{ id: string; notes: string; created_at: string | null }>;

    for (const row of rows) {
      const noteId = crypto.randomUUID();
      await queryRunner.query(
        `INSERT INTO contact_notes (id, contact_id, content, created_at) VALUES (?, ?, ?, ?)`,
        [noteId, row.id, row.notes, row.created_at ?? new Date().toISOString()]
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE IF EXISTS contact_notes");
  }
}
