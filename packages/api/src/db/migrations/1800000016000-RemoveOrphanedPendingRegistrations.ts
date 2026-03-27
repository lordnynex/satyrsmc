import type { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveOrphanedPendingRegistrations1800000016000 implements MigrationInterface {
  name = "RemoveOrphanedPendingRegistrations1800000016000";

  async up(queryRunner: QueryRunner): Promise<void> {
    // Delete orphaned pending registrations (no contact assigned).
    // CASCADE on rsvp_submissions, badger_registrations, and rsvp_logs
    // will clean up child rows automatically.
    await queryRunner.query(
      `DELETE FROM event_attendees
       WHERE contact_id IS NULL
         AND registration_method IS NOT NULL
         AND status = 'pending'`,
    );
  }

  async down(_queryRunner: QueryRunner): Promise<void> {
    // Data deletion is not reversible
  }
}
