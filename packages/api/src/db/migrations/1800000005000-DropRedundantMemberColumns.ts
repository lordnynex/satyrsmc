import type { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Drops redundant flat fields from the members table.
 * Contact is now the canonical source for personal/contact info.
 * Members must have a contact_id (NOT NULL after this migration).
 */
export class DropRedundantMemberColumns1800000005000 implements MigrationInterface {
  name = "DropRedundantMemberColumns1800000005000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Migrate any remaining member photos to contact_photos
    //    (for members that have a photo but no profile-type contact_photo)
    const membersWithPhotos: Array<{
      id: string;
      contact_id: string;
      photo: Buffer;
      photo_thumbnail: Buffer | null;
    }> = await queryRunner.query(`
      SELECT m.id, m.contact_id, m.photo, m.photo_thumbnail
      FROM members m
      WHERE m.contact_id IS NOT NULL
        AND m.photo IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM contact_photos cp
          WHERE cp.contact_id = m.contact_id AND cp.type = 'profile'
        )
    `);

    for (const member of membersWithPhotos) {
      await queryRunner.query(
        `INSERT INTO contact_photos (id, contact_id, type, sort_order, photo, photo_thumbnail, created_at)
         VALUES ($1, $2, 'profile', 0, $3, $4, NOW())`,
        [crypto.randomUUID(), member.contact_id, member.photo, member.photo_thumbnail],
      );
    }

    // 2. Verify all members have contact_id set — fail if any are missing
    const orphans: Array<{ id: string }> = await queryRunner.query(
      `SELECT id FROM members WHERE contact_id IS NULL`,
    );
    if (orphans.length > 0) {
      throw new Error(
        `Cannot proceed: ${orphans.length} member(s) have no contact_id. ` +
          `Run MigrateMemberDataToContacts first. IDs: ${orphans.map((o) => o.id).join(", ")}`,
      );
    }

    // 3. Make contact_id NOT NULL
    await queryRunner.query(`ALTER TABLE members ALTER COLUMN contact_id SET NOT NULL`);

    // 4. Drop redundant columns
    await queryRunner.query(`ALTER TABLE members DROP COLUMN name`);
    await queryRunner.query(`ALTER TABLE members DROP COLUMN email`);
    await queryRunner.query(`ALTER TABLE members DROP COLUMN phone_number`);
    await queryRunner.query(`ALTER TABLE members DROP COLUMN address`);
    await queryRunner.query(`ALTER TABLE members DROP COLUMN emergency_contact_name`);
    await queryRunner.query(`ALTER TABLE members DROP COLUMN emergency_contact_phone`);
    await queryRunner.query(`ALTER TABLE members DROP COLUMN photo`);
    await queryRunner.query(`ALTER TABLE members DROP COLUMN photo_thumbnail`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Re-add columns as nullable (data is lost on rollback)
    await queryRunner.query(`ALTER TABLE members ADD COLUMN name TEXT`);
    await queryRunner.query(`ALTER TABLE members ADD COLUMN email TEXT`);
    await queryRunner.query(`ALTER TABLE members ADD COLUMN phone_number TEXT`);
    await queryRunner.query(`ALTER TABLE members ADD COLUMN address TEXT`);
    await queryRunner.query(`ALTER TABLE members ADD COLUMN emergency_contact_name TEXT`);
    await queryRunner.query(`ALTER TABLE members ADD COLUMN emergency_contact_phone TEXT`);
    await queryRunner.query(`ALTER TABLE members ADD COLUMN photo BYTEA`);
    await queryRunner.query(`ALTER TABLE members ADD COLUMN photo_thumbnail BYTEA`);

    // Restore name from linked contact display_name
    await queryRunner.query(`
      UPDATE members m SET name = c.display_name
      FROM contacts c WHERE c.id = m.contact_id
    `);

    // Allow contact_id to be nullable again
    await queryRunner.query(`ALTER TABLE members ALTER COLUMN contact_id DROP NOT NULL`);
  }
}
