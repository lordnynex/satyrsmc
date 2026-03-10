import type { MigrationInterface } from "typeorm";
import type { QueryRunner } from "typeorm";

/**
 * Adds delivery_type column to mailing_lists for physical/email/both.
 * Migrates existing lists to 'both' for backward compatibility.
 */
export class AddMailingListDeliveryType1740000000000 implements MigrationInterface {
  name = "AddMailingListDeliveryType1740000000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE mailing_lists ADD COLUMN delivery_type TEXT NOT NULL DEFAULT 'both' CHECK (delivery_type IN ('physical', 'email', 'both'))`
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // SQLite does not support DROP COLUMN directly.
  }
}
