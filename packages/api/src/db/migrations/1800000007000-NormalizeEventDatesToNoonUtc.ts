import type { MigrationInterface, QueryRunner } from "typeorm";

export class NormalizeEventDatesToNoonUtc1800000007000 implements MigrationInterface {
  name = "NormalizeEventDatesToNoonUtc1800000007000";

  async up(queryRunner: QueryRunner): Promise<void> {
    // Shift existing midnight-UTC event dates to noon-UTC so that no timezone
    // offset (UTC-12 through UTC+14) can roll the date to a different day.
    await queryRunner.query(`
      UPDATE events
      SET event_date = event_date + interval '12 hours'
      WHERE event_date IS NOT NULL
        AND EXTRACT(HOUR FROM event_date) = 0
        AND EXTRACT(MINUTE FROM event_date) = 0
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE events
      SET event_date = event_date - interval '12 hours'
      WHERE event_date IS NOT NULL
        AND EXTRACT(HOUR FROM event_date) = 12
        AND EXTRACT(MINUTE FROM event_date) = 0
    `);
  }
}
