import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEventRsvpSystem1800000014000 implements MigrationInterface {
  name = "CreateEventRsvpSystem1800000014000";

  async up(queryRunner: QueryRunner): Promise<void> {
    // Enums
    await queryRunner.query(
      `CREATE TYPE event_rsvp_status_enum AS ENUM ('pending_review', 'registered', 'confirmed', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TYPE registration_method_enum AS ENUM ('event_token', 'invitation', 'auth')`,
    );
    await queryRunner.query(
      `CREATE TYPE payment_method_enum AS ENUM ('check', 'cash', 'zelle', 'money_order', 'stripe')`,
    );
    await queryRunner.query(
      `CREATE TYPE payment_status_enum AS ENUM ('not_required', 'pending', 'confirmed', 'refund_requested', 'refunded')`,
    );
    await queryRunner.query(
      `CREATE TYPE tshirt_size_enum AS ENUM ('S', 'M', 'L', 'XL', 'XXL', 'XXXL')`,
    );
    await queryRunner.query(
      `CREATE TYPE travel_mode_enum AS ENUM ('motorcycle', 'car_truck', 'rv_camper')`,
    );
    await queryRunner.query(
      `CREATE TYPE invitation_purpose_enum AS ENUM ('event_open_registration', 'event_registration', 'ride_walkin', 'officer_invite', 'account_setup')`,
    );
    await queryRunner.query(
      `CREATE TYPE rsvp_log_code_enum AS ENUM ('registered', 'matched_to_contact', 'new_contact_created', 'payment_confirmed', 'refund_requested', 'refund_processed', 'cancelled', 'admin_cancelled', 'account_linked', 'status_changed')`,
    );

    // event_rsvps
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
    await queryRunner.query(`CREATE INDEX idx_event_rsvps_event ON event_rsvps(event_id)`);
    await queryRunner.query(`CREATE INDEX idx_event_rsvps_contact ON event_rsvps(contact_id)`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX uq_active_rsvp ON event_rsvps(contact_id, event_id) WHERE cancelled_at IS NULL AND contact_id IS NOT NULL`,
    );

    // rsvp_submissions
    await queryRunner.query(`
      CREATE TABLE rsvp_submissions (
        id TEXT PRIMARY KEY,
        rsvp_id TEXT NOT NULL UNIQUE REFERENCES event_rsvps(id) ON DELETE CASCADE,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        address TEXT,
        zip TEXT,
        emergency_contact_name TEXT NOT NULL,
        emergency_contact_phone TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `);

    // badger_registrations
    await queryRunner.query(`
      CREATE TABLE badger_registrations (
        id TEXT PRIMARY KEY,
        rsvp_id TEXT NOT NULL UNIQUE REFERENCES event_rsvps(id) ON DELETE CASCADE,
        tshirt_size tshirt_size_enum NOT NULL,
        traveling_by travel_mode_enum NOT NULL,
        club TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `);

    // invitations
    await queryRunner.query(`
      CREATE TABLE invitations (
        id TEXT PRIMARY KEY,
        contact_id TEXT REFERENCES contacts(id),
        token_hash TEXT NOT NULL UNIQUE,
        purpose invitation_purpose_enum NOT NULL DEFAULT 'account_setup',
        event_id TEXT REFERENCES events(id),
        created_by_user_id TEXT REFERENCES users(id),
        expires_at TIMESTAMPTZ NOT NULL,
        claimed_at TIMESTAMPTZ,
        rsvp_id TEXT REFERENCES event_rsvps(id),
        created_user_id TEXT REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_invitations_contact ON invitations(contact_id)`);

    // waiver_versions
    await queryRunner.query(`
      CREATE TABLE waiver_versions (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        version INTEGER NOT NULL,
        content_hash TEXT NOT NULL,
        effective_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        retired_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE(title, version)
      )
    `);

    // rsvp_logs
    await queryRunner.query(`
      CREATE TABLE rsvp_logs (
        id TEXT PRIMARY KEY,
        rsvp_id TEXT NOT NULL REFERENCES event_rsvps(id) ON DELETE CASCADE,
        logged_by TEXT REFERENCES users(id),
        message_code rsvp_log_code_enum NOT NULL,
        message TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_rsvp_logs_rsvp ON rsvp_logs(rsvp_id)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE IF EXISTS rsvp_logs");
    await queryRunner.query("DROP TABLE IF EXISTS waiver_versions");
    await queryRunner.query("DROP TABLE IF EXISTS invitations");
    await queryRunner.query("DROP TABLE IF EXISTS badger_registrations");
    await queryRunner.query("DROP TABLE IF EXISTS rsvp_submissions");
    await queryRunner.query("DROP TABLE IF EXISTS event_rsvps");
    await queryRunner.query("DROP TYPE IF EXISTS rsvp_log_code_enum");
    await queryRunner.query("DROP TYPE IF EXISTS invitation_purpose_enum");
    await queryRunner.query("DROP TYPE IF EXISTS travel_mode_enum");
    await queryRunner.query("DROP TYPE IF EXISTS tshirt_size_enum");
    await queryRunner.query("DROP TYPE IF EXISTS payment_status_enum");
    await queryRunner.query("DROP TYPE IF EXISTS payment_method_enum");
    await queryRunner.query("DROP TYPE IF EXISTS registration_method_enum");
    await queryRunner.query("DROP TYPE IF EXISTS event_rsvp_status_enum");
  }
}
