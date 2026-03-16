import type { MigrationInterface, QueryRunner } from "typeorm";

export class EventDateAndHostChanges1800000010000 implements MigrationInterface {
  name = "EventDateAndHostChanges1800000010000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE events RENAME COLUMN event_date TO start_date`);
    await queryRunner.query(`ALTER TABLE events ADD COLUMN end_date TIMESTAMPTZ`);
    await queryRunner.query(`ALTER TABLE events ADD COLUMN host_ids TEXT[] NOT NULL DEFAULT '{}'`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE events DROP COLUMN host_ids`);
    await queryRunner.query(`ALTER TABLE events DROP COLUMN end_date`);
    await queryRunner.query(`ALTER TABLE events RENAME COLUMN start_date TO event_date`);
  }
}
