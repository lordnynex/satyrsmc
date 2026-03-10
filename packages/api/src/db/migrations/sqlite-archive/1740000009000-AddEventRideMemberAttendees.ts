import type { MigrationInterface } from "typeorm";
import type { QueryRunner } from "typeorm";

/**
 * Adds event_ride_member_attendees table for club members who attended a ride.
 */
export class AddEventRideMemberAttendees1740000009000 implements MigrationInterface {
  name = "AddEventRideMemberAttendees1740000009000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS event_ride_member_attendees (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        member_id TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        waiver_signed INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
        FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
        UNIQUE(event_id, member_id)
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_event_ride_member_attendees_event_id ON event_ride_member_attendees(event_id)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE IF EXISTS event_ride_member_attendees");
  }
}
