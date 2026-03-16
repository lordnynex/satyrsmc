import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateLogTables1800000011000 implements MigrationInterface {
  name = "CreateLogTables1800000011000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE activity_message_code_enum AS ENUM (
        'event_attended',
        'run_led',
        'event_review_submitted',
        'run_report_submitted',
        'gallery_photo_submitted',
        'gallery_photos_submitted',
        'profile_photo_submitted',
        'rigbook_photo_submitted',
        'joined'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE membership_message_code_enum AS ENUM (
        'account_created',
        'account_unlocked',
        'account_changed',
        'account_rejected',
        'dues_paid',
        'office_added',
        'office_removed',
        'title_added',
        'title_removed',
        'membership_granted',
        'membership_eligible',
        'guest_restricted'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE activity_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        message_code activity_message_code_enum NOT NULL,
        reference_id TEXT,
        reference_type TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id)`);
    await queryRunner.query(
      `CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC)`,
    );

    await queryRunner.query(`
      CREATE TABLE membership_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        logged_by TEXT,
        message_code membership_message_code_enum NOT NULL,
        message TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_membership_logs_user_id ON membership_logs(user_id)`);
    await queryRunner.query(
      `CREATE INDEX idx_membership_logs_created_at ON membership_logs(created_at DESC)`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE IF EXISTS membership_logs");
    await queryRunner.query("DROP TABLE IF EXISTS activity_logs");
    await queryRunner.query("DROP TYPE IF EXISTS membership_message_code_enum");
    await queryRunner.query("DROP TYPE IF EXISTS activity_message_code_enum");
  }
}
