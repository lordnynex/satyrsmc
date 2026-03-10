import type { MigrationInterface } from "typeorm";
import type { QueryRunner } from "typeorm";

/**
 * Adds start_time, end_time, and video_conference_url to meetings and committee_meetings.
 */
export class AddMeetingTimesAndVideoUrl1740000014000 implements MigrationInterface {
  name = "AddMeetingTimesAndVideoUrl1740000014000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE meetings ADD COLUMN start_time TEXT
    `);
    await queryRunner.query(`
      ALTER TABLE meetings ADD COLUMN end_time TEXT
    `);
    await queryRunner.query(`
      ALTER TABLE meetings ADD COLUMN video_conference_url TEXT
    `);
    await queryRunner.query(`
      ALTER TABLE committee_meetings ADD COLUMN start_time TEXT
    `);
    await queryRunner.query(`
      ALTER TABLE committee_meetings ADD COLUMN end_time TEXT
    `);
    await queryRunner.query(`
      ALTER TABLE committee_meetings ADD COLUMN video_conference_url TEXT
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE meetings DROP COLUMN start_time`);
    await queryRunner.query(`ALTER TABLE meetings DROP COLUMN end_time`);
    await queryRunner.query(`ALTER TABLE meetings DROP COLUMN video_conference_url`);
    await queryRunner.query(`ALTER TABLE committee_meetings DROP COLUMN start_time`);
    await queryRunner.query(`ALTER TABLE committee_meetings DROP COLUMN end_time`);
    await queryRunner.query(`ALTER TABLE committee_meetings DROP COLUMN video_conference_url`);
  }
}
