import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateBikesAndMoveBirthday1800000012000 implements MigrationInterface {
  name = "CreateBikesAndMoveBirthday1800000012000";

  async up(queryRunner: QueryRunner): Promise<void> {
    // Create bikes table
    await queryRunner.query(`
      CREATE TABLE bikes (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        year INTEGER NOT NULL,
        make TEXT NOT NULL,
        model TEXT NOT NULL,
        trim TEXT,
        mods TEXT,
        photo TEXT,
        is_primary BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_bikes_user_id ON bikes(user_id)`);

    // Move birthday from members to contacts
    await queryRunner.query(`ALTER TABLE contacts ADD COLUMN birthday TIMESTAMPTZ`);
    await queryRunner.query(`
      UPDATE contacts c
      SET birthday = m.birthday
      FROM members m
      WHERE m.contact_id = c.id
        AND m.birthday IS NOT NULL
    `);
    await queryRunner.query(`ALTER TABLE members DROP COLUMN birthday`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // Move birthday back from contacts to members
    await queryRunner.query(`ALTER TABLE members ADD COLUMN birthday TIMESTAMPTZ`);
    await queryRunner.query(`
      UPDATE members m
      SET birthday = c.birthday
      FROM contacts c
      WHERE m.contact_id = c.id
        AND c.birthday IS NOT NULL
    `);
    await queryRunner.query(`ALTER TABLE contacts DROP COLUMN birthday`);

    // Drop bikes table
    await queryRunner.query("DROP TABLE IF EXISTS bikes");
  }
}
