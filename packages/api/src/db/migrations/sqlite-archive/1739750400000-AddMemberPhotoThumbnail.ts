import type { MigrationInterface } from "typeorm";
import type { QueryRunner } from "typeorm";

/**
 * Adds photo_thumbnail column to members table for storing small optimized
 * copies of member photos (e.g. for chips and avatars).
 */
export class AddMemberPhotoThumbnail1739750400000 implements MigrationInterface {
  name = "AddMemberPhotoThumbnail1739750400000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE members ADD COLUMN photo_thumbnail BLOB`
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // SQLite does not support DROP COLUMN directly.
    // To revert: create new table without column, copy data, drop old, rename.
    // For simplicity we document manual steps; most deployments won't need down.
  }
}
