import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddBikePhotos1800000013000 implements MigrationInterface {
  name = "AddBikePhotos1800000013000";

  async up(queryRunner: QueryRunner): Promise<void> {
    // Change photo from TEXT to BYTEA and add photo_thumbnail
    await queryRunner.query(`ALTER TABLE bikes DROP COLUMN IF EXISTS photo`);
    await queryRunner.query(`ALTER TABLE bikes ADD COLUMN photo BYTEA`);
    await queryRunner.query(`ALTER TABLE bikes ADD COLUMN photo_thumbnail BYTEA`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE bikes DROP COLUMN IF EXISTS photo_thumbnail`);
    await queryRunner.query(`ALTER TABLE bikes DROP COLUMN IF EXISTS photo`);
    await queryRunner.query(`ALTER TABLE bikes ADD COLUMN photo TEXT`);
  }
}
