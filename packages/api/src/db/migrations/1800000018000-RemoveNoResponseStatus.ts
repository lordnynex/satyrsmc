import type { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveNoResponseStatus1800000018000 implements MigrationInterface {
  name = "RemoveNoResponseStatus1800000018000";

  async up(queryRunner: QueryRunner): Promise<void> {
    // Migrate any existing no_response rows to pending
    await queryRunner.query(
      `UPDATE event_attendees SET status = 'pending' WHERE status = 'no_response'`,
    );

    // Drop the partial unique index that references attendee_status_enum in its predicate.
    // PGlite cannot cast a column to text while a constraint/index references the old enum type.
    await queryRunner.query(`DROP INDEX IF EXISTS uq_attendee_active`);

    // Recreate enum without no_response and update column default
    // Cast to text first, drop the old type, create new type, cast back.
    await queryRunner.query(`ALTER TABLE event_attendees ALTER COLUMN status DROP DEFAULT`);
    await queryRunner.query(`
      ALTER TABLE event_attendees
        ALTER COLUMN status TYPE text
        USING status::text
    `);
    await queryRunner.query(`DROP TYPE attendee_status_enum`);
    await queryRunner.query(`CREATE TYPE attendee_status_enum AS ENUM ('pending', 'yes', 'no')`);
    await queryRunner.query(`
      ALTER TABLE event_attendees
        ALTER COLUMN status TYPE attendee_status_enum
        USING status::attendee_status_enum
    `);
    await queryRunner.query(
      `ALTER TABLE event_attendees ALTER COLUMN status SET DEFAULT 'pending'`,
    );

    // Recreate the partial unique index with the updated enum type
    await queryRunner.query(
      `CREATE UNIQUE INDEX uq_attendee_active ON event_attendees(event_id, contact_id) WHERE contact_id IS NOT NULL AND cancelled_at IS NULL AND status != 'no'`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE event_attendees ALTER COLUMN status DROP DEFAULT`);
    await queryRunner.query(`
      ALTER TABLE event_attendees
        ALTER COLUMN status TYPE text
        USING status::text
    `);
    await queryRunner.query(`DROP TYPE attendee_status_enum`);
    await queryRunner.query(
      `CREATE TYPE attendee_status_enum AS ENUM ('no_response', 'pending', 'yes', 'no')`,
    );
    await queryRunner.query(`
      ALTER TABLE event_attendees
        ALTER COLUMN status TYPE attendee_status_enum
        USING status::attendee_status_enum
    `);
    await queryRunner.query(
      `ALTER TABLE event_attendees ALTER COLUMN status SET DEFAULT 'no_response'`,
    );
  }
}
