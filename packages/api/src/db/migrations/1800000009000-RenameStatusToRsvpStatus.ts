import type { MigrationInterface, QueryRunner } from "typeorm";

export class RenameStatusToRsvpStatus1800000009000 implements MigrationInterface {
  name = "RenameStatusToRsvpStatus1800000009000";

  async up(queryRunner: QueryRunner): Promise<void> {
    // Only rename if the old column exists (fresh DBs already have rsvp_status from migration 8000)
    const cols = (await queryRunner.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'event_attendees' AND column_name = 'status'`,
    )) as Array<{ column_name: string }>;
    if (cols.length > 0) {
      await queryRunner.query(`ALTER TABLE event_attendees RENAME COLUMN status TO rsvp_status`);
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE event_attendees RENAME COLUMN rsvp_status TO status`);
  }
}
