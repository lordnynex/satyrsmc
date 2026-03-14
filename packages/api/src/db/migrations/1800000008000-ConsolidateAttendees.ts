import type { MigrationInterface, QueryRunner } from "typeorm";

export class ConsolidateAttendees1800000008000 implements MigrationInterface {
  name = "ConsolidateAttendees1800000008000";

  async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add status + timestamps + unique constraint to event_attendees
    await queryRunner.query(`
      ALTER TABLE event_attendees ADD COLUMN IF NOT EXISTS rsvp_status TEXT NOT NULL DEFAULT 'no_response'
    `);
    await queryRunner.query(`
      ALTER TABLE event_attendees ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now()
    `);
    await queryRunner.query(`
      ALTER TABLE event_attendees ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now()
    `);
    await queryRunner.query(`
      ALTER TABLE event_attendees ADD CONSTRAINT uq_event_attendees_event_contact UNIQUE (event_id, contact_id)
    `);

    // 2. Add members_only to events
    await queryRunner.query(`
      ALTER TABLE events ADD COLUMN IF NOT EXISTS members_only BOOLEAN NOT NULL DEFAULT false
    `);

    // 3. Migrate event_ride_member_attendees → event_attendees (via member.contact_id)
    //    These were admin-added post-event, so status = 'yes' (they attended)
    await queryRunner.query(`
      INSERT INTO event_attendees (id, event_id, contact_id, sort_order, waiver_signed, rsvp_status, created_at, updated_at)
      SELECT erma.id, erma.event_id, m.contact_id, erma.sort_order, erma.waiver_signed, 'yes', now(), now()
      FROM event_ride_member_attendees erma
      JOIN members m ON m.id = erma.member_id
      ON CONFLICT (event_id, contact_id) DO UPDATE SET
        waiver_signed = EXCLUDED.waiver_signed OR event_attendees.waiver_signed,
        rsvp_status = 'yes'
    `);

    // 4. Migrate event_rsvps → event_attendees (via user.contact_id)
    await queryRunner.query(`
      INSERT INTO event_attendees (id, event_id, contact_id, sort_order, waiver_signed, rsvp_status, created_at, updated_at)
      SELECT er.id, er.event_id, u.contact_id, 0, false, er.status, er.created_at, er.updated_at
      FROM event_rsvps er
      JOIN users u ON u.id = er.user_id
      ON CONFLICT (event_id, contact_id) DO UPDATE SET
        rsvp_status = EXCLUDED.rsvp_status,
        updated_at = EXCLUDED.updated_at
    `);

    // 5. Drop old tables
    await queryRunner.query(`DROP TABLE IF EXISTS event_rsvps`);
    await queryRunner.query(`DROP TABLE IF EXISTS event_ride_member_attendees`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate old tables
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS event_ride_member_attendees (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        sort_order INTEGER NOT NULL DEFAULT 0,
        waiver_signed BOOLEAN NOT NULL DEFAULT FALSE,
        UNIQUE(event_id, member_id)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS event_rsvps (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'no_response',
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE(event_id, user_id)
      )
    `);

    // Remove added columns
    await queryRunner.query(`ALTER TABLE events DROP COLUMN IF EXISTS members_only`);
    await queryRunner.query(
      `ALTER TABLE event_attendees DROP CONSTRAINT IF EXISTS uq_event_attendees_event_contact`,
    );
    await queryRunner.query(`ALTER TABLE event_attendees DROP COLUMN IF EXISTS updated_at`);
    await queryRunner.query(`ALTER TABLE event_attendees DROP COLUMN IF EXISTS created_at`);
    await queryRunner.query(`ALTER TABLE event_attendees DROP COLUMN IF EXISTS rsvp_status`);
    await queryRunner.query(`ALTER TABLE event_attendees DROP COLUMN IF EXISTS status`);
  }
}
