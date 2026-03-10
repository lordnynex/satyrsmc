import type { MigrationInterface } from "typeorm";
import type { QueryRunner } from "typeorm";

/**
 * Adds event_type column to events table.
 * Values: badger, anniversary, pioneer_run, rides
 */
export class AddEventType1740000007000 implements MigrationInterface {
  name = "AddEventType1740000007000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE events ADD COLUMN event_type TEXT NOT NULL DEFAULT 'badger'
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE events DROP COLUMN event_type`);
  }
}
