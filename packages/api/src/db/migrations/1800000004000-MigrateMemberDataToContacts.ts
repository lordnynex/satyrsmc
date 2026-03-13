import type { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Data migration: for each member without a contact_id, attempts to match
 * an existing contact by email or name, or creates a new Contact record.
 * Links the member to the contact via contact_id.
 */
export class MigrateMemberDataToContacts1800000004000 implements MigrationInterface {
  name = "MigrateMemberDataToContacts1800000004000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Get all members that don't have a contact_id yet
    const members: Array<{
      id: string;
      name: string;
      email: string | null;
      phone_number: string | null;
      address: string | null;
      emergency_contact_name: string | null;
      emergency_contact_phone: string | null;
    }> = await queryRunner.query(`
      SELECT id, name, email, phone_number, address,
             emergency_contact_name, emergency_contact_phone
      FROM members WHERE contact_id IS NULL
    `);

    for (const member of members) {
      let contactId: string | null = null;

      // Try to match by email first (most reliable)
      if (member.email) {
        const emailMatch: Array<{ contact_id: string }> = await queryRunner.query(
          `SELECT contact_id FROM contact_emails WHERE LOWER(email) = LOWER($1) LIMIT 1`,
          [member.email],
        );
        if (emailMatch.length > 0) {
          contactId = emailMatch[0]!.contact_id;
        }
      }

      // If no email match, try by display_name
      if (!contactId) {
        const nameMatch: Array<{ id: string }> = await queryRunner.query(
          `SELECT id FROM contacts WHERE LOWER(display_name) = LOWER($1) AND status != 'deleted' LIMIT 1`,
          [member.name],
        );
        if (nameMatch.length > 0) {
          contactId = nameMatch[0]!.id;
        }
      }

      // If no match, create a new contact
      if (!contactId) {
        contactId = crypto.randomUUID();
        const nameParts = member.name.trim().split(/\s+/);
        const firstName = nameParts[0] ?? member.name;
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : null;

        await queryRunner.query(
          `INSERT INTO contacts (id, type, status, display_name, first_name, last_name, created_at, updated_at)
           VALUES ($1, 'person', 'active', $2, $3, $4, NOW(), NOW())`,
          [contactId, member.name, firstName, lastName],
        );

        // Create contact_emails if member has email
        if (member.email) {
          await queryRunner.query(
            `INSERT INTO contact_emails (id, contact_id, email, type, is_primary)
             VALUES ($1, $2, $3, 'home', true)`,
            [crypto.randomUUID(), contactId, member.email],
          );
        }

        // Create contact_phones if member has phone
        if (member.phone_number) {
          await queryRunner.query(
            `INSERT INTO contact_phones (id, contact_id, phone, type, is_primary)
             VALUES ($1, $2, $3, 'cell', true)`,
            [crypto.randomUUID(), contactId, member.phone_number],
          );
        }

        // Create contact_addresses if member has address
        if (member.address) {
          await queryRunner.query(
            `INSERT INTO contact_addresses (id, contact_id, address_line1, type, is_primary_mailing, country)
             VALUES ($1, $2, $3, 'home', true, 'US')`,
            [crypto.randomUUID(), contactId, member.address],
          );
        }

        // Create contact_emergency_contacts if member has emergency contact
        if (member.emergency_contact_name) {
          await queryRunner.query(
            `INSERT INTO contact_emergency_contacts (id, contact_id, name, phone)
             VALUES ($1, $2, $3, $4)`,
            [
              crypto.randomUUID(),
              contactId,
              member.emergency_contact_name,
              member.emergency_contact_phone || "",
            ],
          );
        }
      }

      // Link member to contact
      await queryRunner.query(`UPDATE members SET contact_id = $1 WHERE id = $2`, [
        contactId,
        member.id,
      ]);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Set all member contact_ids to null (does not delete contacts created by this migration)
    await queryRunner.query(`UPDATE members SET contact_id = NULL`);
  }
}
