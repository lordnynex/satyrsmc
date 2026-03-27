import type { MigrationInterface, QueryRunner } from "typeorm";

export class MergeRsvpIntoAttendees1800000015000 implements MigrationInterface {
  name = "MergeRsvpIntoAttendees1800000015000";

  async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create the unified attendee_status_enum
    await queryRunner.query(
      `CREATE TYPE attendee_status_enum AS ENUM ('no_response', 'pending', 'yes', 'no')`,
    );

    // 2. Make contact_id nullable
    await queryRunner.query(`ALTER TABLE event_attendees ALTER COLUMN contact_id DROP NOT NULL`);

    // 3. Add new columns from event_rsvps
    await queryRunner.query(`
      ALTER TABLE event_attendees
        ADD COLUMN user_id TEXT REFERENCES users(id),
        ADD COLUMN registration_method registration_method_enum,
        ADD COLUMN invitation_id TEXT,
        ADD COLUMN status attendee_status_enum NOT NULL DEFAULT 'no_response',
        ADD COLUMN cancelled_at TIMESTAMPTZ,
        ADD COLUMN reviewed_by_user_id TEXT REFERENCES users(id),
        ADD COLUMN reviewed_at TIMESTAMPTZ,
        ADD COLUMN waiver_content_hash TEXT,
        ADD COLUMN waiver_accepted_at TIMESTAMPTZ,
        ADD COLUMN waiver_ip TEXT,
        ADD COLUMN waiver_user_agent TEXT,
        ADD COLUMN payment_method payment_method_enum,
        ADD COLUMN payment_status payment_status_enum NOT NULL DEFAULT 'not_required',
        ADD COLUMN payment_amount_cents INTEGER,
        ADD COLUMN payment_confirmed_by_user_id TEXT REFERENCES users(id),
        ADD COLUMN payment_confirmed_at TIMESTAMPTZ,
        ADD COLUMN external_payment_id TEXT,
        ADD COLUMN external_refund_id TEXT
    `);

    // 4. Migrate existing rsvp_status text → status enum
    // Map: yes→yes, no→no, pending→pending, no_response→no_response
    await queryRunner.query(`
      UPDATE event_attendees SET status = CASE
        WHEN rsvp_status = 'yes' THEN 'yes'::attendee_status_enum
        WHEN rsvp_status = 'no' THEN 'no'::attendee_status_enum
        WHEN rsvp_status = 'pending' THEN 'pending'::attendee_status_enum
        ELSE 'no_response'::attendee_status_enum
      END
    `);

    // 5. Copy event_rsvps rows into event_attendees
    // Map: pending_review→pending, registered→yes, confirmed→yes, cancelled→no
    await queryRunner.query(`
      INSERT INTO event_attendees (
        id, event_id, contact_id, sort_order, waiver_signed,
        status, user_id, registration_method, invitation_id,
        cancelled_at, reviewed_by_user_id, reviewed_at,
        waiver_content_hash, waiver_accepted_at, waiver_ip, waiver_user_agent,
        payment_method, payment_status, payment_amount_cents,
        payment_confirmed_by_user_id, payment_confirmed_at,
        external_payment_id, external_refund_id,
        created_at, updated_at
      )
      SELECT
        id, event_id, contact_id, 0, true,
        CASE
          WHEN status = 'pending_review' THEN 'pending'::attendee_status_enum
          WHEN status = 'registered' THEN 'yes'::attendee_status_enum
          WHEN status = 'confirmed' THEN 'yes'::attendee_status_enum
          WHEN status = 'cancelled' THEN 'no'::attendee_status_enum
        END,
        user_id, registration_method, invitation_id,
        cancelled_at, reviewed_by_user_id, reviewed_at,
        waiver_content_hash, waiver_accepted_at, waiver_ip, waiver_user_agent,
        payment_method, payment_status, payment_amount_cents,
        payment_confirmed_by_user_id, payment_confirmed_at,
        external_payment_id, external_refund_id,
        created_at, updated_at
      FROM event_rsvps
    `);

    // 6. Drop & recreate FKs on child tables to reference event_attendees
    // rsvp_submissions
    await queryRunner.query(
      `ALTER TABLE rsvp_submissions DROP CONSTRAINT IF EXISTS rsvp_submissions_rsvp_id_fkey`,
    );
    await queryRunner.query(
      `ALTER TABLE rsvp_submissions ADD CONSTRAINT rsvp_submissions_rsvp_id_fkey FOREIGN KEY (rsvp_id) REFERENCES event_attendees(id) ON DELETE CASCADE`,
    );

    // badger_registrations
    await queryRunner.query(
      `ALTER TABLE badger_registrations DROP CONSTRAINT IF EXISTS badger_registrations_rsvp_id_fkey`,
    );
    await queryRunner.query(
      `ALTER TABLE badger_registrations ADD CONSTRAINT badger_registrations_rsvp_id_fkey FOREIGN KEY (rsvp_id) REFERENCES event_attendees(id) ON DELETE CASCADE`,
    );

    // rsvp_logs
    await queryRunner.query(
      `ALTER TABLE rsvp_logs DROP CONSTRAINT IF EXISTS rsvp_logs_rsvp_id_fkey`,
    );
    await queryRunner.query(
      `ALTER TABLE rsvp_logs ADD CONSTRAINT rsvp_logs_rsvp_id_fkey FOREIGN KEY (rsvp_id) REFERENCES event_attendees(id) ON DELETE CASCADE`,
    );

    // invitations (rsvp_id column)
    await queryRunner.query(
      `ALTER TABLE invitations DROP CONSTRAINT IF EXISTS invitations_rsvp_id_fkey`,
    );
    await queryRunner.query(
      `ALTER TABLE invitations ADD CONSTRAINT invitations_rsvp_id_fkey FOREIGN KEY (rsvp_id) REFERENCES event_attendees(id)`,
    );

    // 7. Drop old rsvp_status text column
    await queryRunner.query(`ALTER TABLE event_attendees DROP COLUMN rsvp_status`);

    // 8. Drop old unique constraint and create partial unique index
    await queryRunner.query(
      `ALTER TABLE event_attendees DROP CONSTRAINT IF EXISTS uq_event_attendees_event_contact`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX uq_attendee_active ON event_attendees(event_id, contact_id) WHERE contact_id IS NOT NULL AND cancelled_at IS NULL AND status != 'no'`,
    );

    // 9. Add index for event lookups
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_event_attendees_event ON event_attendees(event_id)`,
    );

    // 10. Drop event_rsvps table
    await queryRunner.query(`DROP TABLE event_rsvps`);

    // 11. Drop old enum type
    await queryRunner.query(`DROP TYPE IF EXISTS event_rsvp_status_enum`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate event_rsvp_status_enum
    await queryRunner.query(
      `CREATE TYPE event_rsvp_status_enum AS ENUM ('pending_review', 'registered', 'confirmed', 'cancelled')`,
    );

    // Recreate event_rsvps table
    await queryRunner.query(`
      CREATE TABLE event_rsvps (
        id TEXT PRIMARY KEY,
        contact_id TEXT REFERENCES contacts(id),
        user_id TEXT REFERENCES users(id),
        event_id TEXT NOT NULL REFERENCES events(id),
        registration_method registration_method_enum NOT NULL,
        invitation_id TEXT,
        status event_rsvp_status_enum NOT NULL DEFAULT 'pending_review',
        cancelled_at TIMESTAMPTZ,
        reviewed_by_user_id TEXT REFERENCES users(id),
        reviewed_at TIMESTAMPTZ,
        waiver_content_hash TEXT NOT NULL,
        waiver_accepted_at TIMESTAMPTZ NOT NULL,
        waiver_ip TEXT NOT NULL,
        waiver_user_agent TEXT,
        payment_method payment_method_enum,
        payment_status payment_status_enum NOT NULL DEFAULT 'not_required',
        payment_amount_cents INTEGER,
        payment_confirmed_by_user_id TEXT REFERENCES users(id),
        payment_confirmed_at TIMESTAMPTZ,
        external_payment_id TEXT,
        external_refund_id TEXT,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      )
    `);

    // Move registration rows back to event_rsvps
    await queryRunner.query(`
      INSERT INTO event_rsvps (
        id, event_id, contact_id, user_id, registration_method, invitation_id,
        status, cancelled_at, reviewed_by_user_id, reviewed_at,
        waiver_content_hash, waiver_accepted_at, waiver_ip, waiver_user_agent,
        payment_method, payment_status, payment_amount_cents,
        payment_confirmed_by_user_id, payment_confirmed_at,
        external_payment_id, external_refund_id,
        created_at, updated_at
      )
      SELECT
        id, event_id, contact_id, user_id, registration_method, invitation_id,
        CASE
          WHEN status = 'pending' THEN 'pending_review'::event_rsvp_status_enum
          WHEN status = 'yes' THEN 'registered'::event_rsvp_status_enum
          WHEN status = 'no' THEN 'cancelled'::event_rsvp_status_enum
          ELSE 'pending_review'::event_rsvp_status_enum
        END,
        cancelled_at, reviewed_by_user_id, reviewed_at,
        waiver_content_hash, waiver_accepted_at, waiver_ip, waiver_user_agent,
        payment_method, payment_status, payment_amount_cents,
        payment_confirmed_by_user_id, payment_confirmed_at,
        external_payment_id, external_refund_id,
        created_at, updated_at
      FROM event_attendees
      WHERE registration_method IS NOT NULL
    `);

    // Restore FKs to event_rsvps
    await queryRunner.query(
      `ALTER TABLE rsvp_submissions DROP CONSTRAINT IF EXISTS rsvp_submissions_rsvp_id_fkey`,
    );
    await queryRunner.query(
      `ALTER TABLE rsvp_submissions ADD CONSTRAINT rsvp_submissions_rsvp_id_fkey FOREIGN KEY (rsvp_id) REFERENCES event_rsvps(id) ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE badger_registrations DROP CONSTRAINT IF EXISTS badger_registrations_rsvp_id_fkey`,
    );
    await queryRunner.query(
      `ALTER TABLE badger_registrations ADD CONSTRAINT badger_registrations_rsvp_id_fkey FOREIGN KEY (rsvp_id) REFERENCES event_rsvps(id) ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE rsvp_logs DROP CONSTRAINT IF EXISTS rsvp_logs_rsvp_id_fkey`,
    );
    await queryRunner.query(
      `ALTER TABLE rsvp_logs ADD CONSTRAINT rsvp_logs_rsvp_id_fkey FOREIGN KEY (rsvp_id) REFERENCES event_rsvps(id) ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE invitations DROP CONSTRAINT IF EXISTS invitations_rsvp_id_fkey`,
    );
    await queryRunner.query(
      `ALTER TABLE invitations ADD CONSTRAINT invitations_rsvp_id_fkey FOREIGN KEY (rsvp_id) REFERENCES event_rsvps(id)`,
    );

    // Delete migrated registration rows from event_attendees
    await queryRunner.query(`DELETE FROM event_attendees WHERE registration_method IS NOT NULL`);

    // Drop new columns
    await queryRunner.query(`
      ALTER TABLE event_attendees
        DROP COLUMN IF EXISTS user_id,
        DROP COLUMN IF EXISTS registration_method,
        DROP COLUMN IF EXISTS invitation_id,
        DROP COLUMN IF EXISTS status,
        DROP COLUMN IF EXISTS cancelled_at,
        DROP COLUMN IF EXISTS reviewed_by_user_id,
        DROP COLUMN IF EXISTS reviewed_at,
        DROP COLUMN IF EXISTS waiver_content_hash,
        DROP COLUMN IF EXISTS waiver_accepted_at,
        DROP COLUMN IF EXISTS waiver_ip,
        DROP COLUMN IF EXISTS waiver_user_agent,
        DROP COLUMN IF EXISTS payment_method,
        DROP COLUMN IF EXISTS payment_status,
        DROP COLUMN IF EXISTS payment_amount_cents,
        DROP COLUMN IF EXISTS payment_confirmed_by_user_id,
        DROP COLUMN IF EXISTS payment_confirmed_at,
        DROP COLUMN IF EXISTS external_payment_id,
        DROP COLUMN IF EXISTS external_refund_id
    `);

    // Restore rsvp_status text column
    await queryRunner.query(
      `ALTER TABLE event_attendees ADD COLUMN rsvp_status TEXT NOT NULL DEFAULT 'no_response'`,
    );

    // Restore unique constraint
    await queryRunner.query(`DROP INDEX IF EXISTS uq_attendee_active`);
    await queryRunner.query(`ALTER TABLE event_attendees ALTER COLUMN contact_id SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE event_attendees ADD CONSTRAINT uq_event_attendees_event_contact UNIQUE (event_id, contact_id)`,
    );

    // Drop attendee_status_enum
    await queryRunner.query(`DROP TYPE IF EXISTS attendee_status_enum`);
  }
}
