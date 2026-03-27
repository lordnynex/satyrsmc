import type { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveTokenRsvpFlow1800000019000 implements MigrationInterface {
  name = "RemoveTokenRsvpFlow1800000019000";

  async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the rsvp_submissions table — token-based anonymous registrations
    // are no longer supported; all RSVPs now require an authenticated account.
    await queryRunner.query(`DROP TABLE IF EXISTS rsvp_submissions`);

    // Enforce that every attendee row has a contact_id.
    // Any legacy rows with null contact_id (from old token registrations)
    // should have been cleaned up by migration 16000; assert none remain.
    await queryRunner.query(`ALTER TABLE event_attendees ALTER COLUMN contact_id SET NOT NULL`);

    // Remove event_token from registration_method_enum.
    // Cast to text, drop old type, recreate without event_token, cast back.
    await queryRunner.query(
      `ALTER TABLE event_attendees ALTER COLUMN registration_method DROP DEFAULT`,
    );
    await queryRunner.query(`
      ALTER TABLE event_attendees
        ALTER COLUMN registration_method TYPE text
        USING registration_method::text
    `);
    await queryRunner.query(`DROP TYPE IF EXISTS registration_method_enum`);
    await queryRunner.query(`CREATE TYPE registration_method_enum AS ENUM ('invitation', 'auth')`);
    await queryRunner.query(`
      ALTER TABLE event_attendees
        ALTER COLUMN registration_method TYPE registration_method_enum
        USING registration_method::registration_method_enum
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // Restore contact_id nullability
    await queryRunner.query(`ALTER TABLE event_attendees ALTER COLUMN contact_id DROP NOT NULL`);

    // Restore event_token to the enum (table cannot be restored)
    await queryRunner.query(
      `ALTER TABLE event_attendees ALTER COLUMN registration_method DROP DEFAULT`,
    );
    await queryRunner.query(`
      ALTER TABLE event_attendees
        ALTER COLUMN registration_method TYPE text
        USING registration_method::text
    `);
    await queryRunner.query(`DROP TYPE IF EXISTS registration_method_enum`);
    await queryRunner.query(
      `CREATE TYPE registration_method_enum AS ENUM ('event_token', 'invitation', 'auth')`,
    );
    await queryRunner.query(`
      ALTER TABLE event_attendees
        ALTER COLUMN registration_method TYPE registration_method_enum
        USING registration_method::registration_method_enum
    `);
  }
}
