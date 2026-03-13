import type { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Creates the users and registrations tables for the authentication system.
 * Users link to contacts (required) and optionally to members.
 * Registrations track pending sign-up invitations.
 */
export class CreateUsersAndRegistrations1800000003000 implements MigrationInterface {
  name = "CreateUsersAndRegistrations1800000003000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`CREATE TYPE user_type_enum AS ENUM ('user', 'admin', 'webmaster')`);
    await queryRunner.query(
      `CREATE TYPE user_status_enum AS ENUM ('active', 'locked', 'rejected', 'suspended', 'inactive', 'deactivated')`,
    );

    // Create users table
    await queryRunner.query(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        contact_id TEXT NOT NULL REFERENCES contacts(id),
        member_id TEXT REFERENCES members(id),
        username TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        user_type user_type_enum NOT NULL DEFAULT 'user',
        user_status user_status_enum NOT NULL DEFAULT 'locked',
        last_login TIMESTAMPTZ,
        failed_login_attempts INTEGER NOT NULL DEFAULT 0,
        locked_until TIMESTAMPTZ,
        reset_token_hash TEXT,
        reset_token_expires_at TIMESTAMPTZ,
        password_changed_at TIMESTAMPTZ,
        admin_note TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT uq_users_username UNIQUE (username)
      )
    `);

    await queryRunner.query(`CREATE INDEX idx_users_contact_id ON users(contact_id)`);
    await queryRunner.query(`CREATE INDEX idx_users_member_id ON users(member_id)`);
    await queryRunner.query(`CREATE INDEX idx_users_username ON users(username)`);

    // Create registrations table
    await queryRunner.query(`
      CREATE TABLE registrations (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        first_name TEXT,
        last_name TEXT,
        token_hash TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        contact_id TEXT REFERENCES contacts(id),
        member_id TEXT REFERENCES members(id),
        invited_by TEXT REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await queryRunner.query(
      `CREATE INDEX idx_registrations_token_hash ON registrations(token_hash)`,
    );
    await queryRunner.query(`CREATE INDEX idx_registrations_email ON registrations(email)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_registrations_email`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_registrations_token_hash`);
    await queryRunner.query(`DROP TABLE IF EXISTS registrations`);

    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_username`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_member_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_contact_id`);
    await queryRunner.query(`DROP TABLE IF EXISTS users`);

    await queryRunner.query(`DROP TYPE IF EXISTS user_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS user_type_enum`);
  }
}
