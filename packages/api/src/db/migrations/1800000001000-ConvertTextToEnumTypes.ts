import type { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Converts TEXT columns (with optional CHECK constraints) to native Postgres ENUM types.
 * Each ENUM type is created once and referenced by all columns that share it.
 *
 * The ALTER pattern drops the default first (text default is incompatible with enum type),
 * converts using a direct cast, then re-sets the default. This is compatible with both
 * standard Postgres and PGlite (used in tests).
 */
export class ConvertTextToEnumTypes1800000001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // --- Create ENUM types ---

    await queryRunner.query(`CREATE TYPE motion_result_enum AS ENUM ('pass', 'fail')`);
    await queryRunner.query(`CREATE TYPE action_item_status_enum AS ENUM ('open', 'completed')`);
    await queryRunner.query(`CREATE TYPE old_business_status_enum AS ENUM ('open', 'closed')`);
    await queryRunner.query(`CREATE TYPE meeting_template_type_enum AS ENUM ('agenda', 'minutes')`);
    await queryRunner.query(`CREATE TYPE committee_status_enum AS ENUM ('active', 'closed')`);
    await queryRunner.query(
      `CREATE TYPE event_type_enum AS ENUM ('badger', 'anniversary', 'pioneer_run', 'rides')`,
    );
    await queryRunner.query(
      `CREATE TYPE event_assignment_category_enum AS ENUM ('planning', 'during')`,
    );
    await queryRunner.query(`CREATE TYPE contact_type_enum AS ENUM ('person', 'organization')`);
    await queryRunner.query(
      `CREATE TYPE contact_status_enum AS ENUM ('active', 'inactive', 'deleted')`,
    );
    await queryRunner.query(`CREATE TYPE consent_status_enum AS ENUM ('yes', 'no', 'unknown')`);
    await queryRunner.query(
      `CREATE TYPE member_position_enum AS ENUM ('President', 'Vice President', 'Road Captain', 'Treasurer', 'Recording Secretary', 'Correspondence Secretary', 'Member')`,
    );
    await queryRunner.query(`CREATE TYPE contact_photo_type_enum AS ENUM ('profile', 'contact')`);
    await queryRunner.query(
      `CREATE TYPE contact_email_type_enum AS ENUM ('work', 'home', 'other')`,
    );
    await queryRunner.query(
      `CREATE TYPE contact_phone_type_enum AS ENUM ('work', 'home', 'cell', 'other')`,
    );
    await queryRunner.query(
      `CREATE TYPE contact_address_type_enum AS ENUM ('home', 'work', 'postal', 'other')`,
    );
    await queryRunner.query(
      `CREATE TYPE mailing_list_type_enum AS ENUM ('static', 'dynamic', 'hybrid')`,
    );
    await queryRunner.query(
      `CREATE TYPE mailing_delivery_type_enum AS ENUM ('physical', 'email', 'both')`,
    );
    await queryRunner.query(
      `CREATE TYPE mailing_member_source_enum AS ENUM ('manual', 'import', 'rule')`,
    );
    await queryRunner.query(
      `CREATE TYPE mailing_recipient_status_enum AS ENUM ('queued', 'printed', 'mailed', 'returned', 'invalid')`,
    );

    // --- Drop CHECK constraints ---

    await queryRunner.query(`ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_type_check`);
    await queryRunner.query(`ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_status_check`);
    await queryRunner.query(
      `ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_ok_to_email_check`,
    );
    await queryRunner.query(
      `ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_ok_to_mail_check`,
    );
    await queryRunner.query(
      `ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_ok_to_sms_check`,
    );
    await queryRunner.query(
      `ALTER TABLE contact_emails DROP CONSTRAINT IF EXISTS contact_emails_type_check`,
    );
    await queryRunner.query(
      `ALTER TABLE contact_phones DROP CONSTRAINT IF EXISTS contact_phones_type_check`,
    );
    await queryRunner.query(
      `ALTER TABLE contact_addresses DROP CONSTRAINT IF EXISTS contact_addresses_type_check`,
    );
    await queryRunner.query(
      `ALTER TABLE event_assignments DROP CONSTRAINT IF EXISTS event_assignments_category_check`,
    );
    await queryRunner.query(
      `ALTER TABLE mailing_lists DROP CONSTRAINT IF EXISTS mailing_lists_list_type_check`,
    );
    await queryRunner.query(
      `ALTER TABLE mailing_lists DROP CONSTRAINT IF EXISTS mailing_lists_delivery_type_check`,
    );
    await queryRunner.query(
      `ALTER TABLE mailing_list_members DROP CONSTRAINT IF EXISTS mailing_list_members_source_check`,
    );
    await queryRunner.query(
      `ALTER TABLE mailing_batch_recipients DROP CONSTRAINT IF EXISTS mailing_batch_recipients_status_check`,
    );

    // --- Convert columns to ENUM types ---
    // Pattern: drop default → alter type → set default (PGlite compatible)

    const conversions: Array<{
      table: string;
      column: string;
      enumType: string;
      defaultVal?: string;
    }> = [
      { table: "meeting_motions", column: "result", enumType: "motion_result_enum" },
      {
        table: "meeting_action_items",
        column: "status",
        enumType: "action_item_status_enum",
        defaultVal: "open",
      },
      {
        table: "old_business_items",
        column: "status",
        enumType: "old_business_status_enum",
        defaultVal: "open",
      },
      { table: "meeting_templates", column: "type", enumType: "meeting_template_type_enum" },
      {
        table: "committees",
        column: "status",
        enumType: "committee_status_enum",
        defaultVal: "active",
      },
      { table: "events", column: "event_type", enumType: "event_type_enum", defaultVal: "badger" },
      {
        table: "event_assignments",
        column: "category",
        enumType: "event_assignment_category_enum",
      },
      { table: "contacts", column: "type", enumType: "contact_type_enum", defaultVal: "person" },
      {
        table: "contacts",
        column: "status",
        enumType: "contact_status_enum",
        defaultVal: "active",
      },
      {
        table: "contacts",
        column: "ok_to_email",
        enumType: "consent_status_enum",
        defaultVal: "unknown",
      },
      {
        table: "contacts",
        column: "ok_to_mail",
        enumType: "consent_status_enum",
        defaultVal: "unknown",
      },
      {
        table: "contacts",
        column: "ok_to_sms",
        enumType: "consent_status_enum",
        defaultVal: "unknown",
      },
      { table: "members", column: "position", enumType: "member_position_enum" },
      {
        table: "contact_photos",
        column: "type",
        enumType: "contact_photo_type_enum",
        defaultVal: "contact",
      },
      {
        table: "contact_emails",
        column: "type",
        enumType: "contact_email_type_enum",
        defaultVal: "other",
      },
      {
        table: "contact_phones",
        column: "type",
        enumType: "contact_phone_type_enum",
        defaultVal: "other",
      },
      {
        table: "contact_addresses",
        column: "type",
        enumType: "contact_address_type_enum",
        defaultVal: "home",
      },
      {
        table: "mailing_lists",
        column: "list_type",
        enumType: "mailing_list_type_enum",
        defaultVal: "static",
      },
      {
        table: "mailing_lists",
        column: "delivery_type",
        enumType: "mailing_delivery_type_enum",
        defaultVal: "both",
      },
      {
        table: "mailing_list_members",
        column: "source",
        enumType: "mailing_member_source_enum",
        defaultVal: "manual",
      },
      {
        table: "mailing_batch_recipients",
        column: "status",
        enumType: "mailing_recipient_status_enum",
        defaultVal: "queued",
      },
    ];

    for (const { table, column, enumType, defaultVal } of conversions) {
      // Always drop default first — PGlite cannot cast when any default exists
      await queryRunner.query(`ALTER TABLE ${table} ALTER COLUMN ${column} DROP DEFAULT`);
      await queryRunner.query(
        `ALTER TABLE ${table} ALTER COLUMN ${column} TYPE ${enumType} USING ${column}::${enumType}`,
      );
      if (defaultVal) {
        await queryRunner.query(
          `ALTER TABLE ${table} ALTER COLUMN ${column} SET DEFAULT '${defaultVal}'`,
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const reversions: Array<{ table: string; column: string; defaultVal?: string }> = [
      { table: "meeting_motions", column: "result" },
      { table: "meeting_action_items", column: "status", defaultVal: "open" },
      { table: "old_business_items", column: "status", defaultVal: "open" },
      { table: "meeting_templates", column: "type" },
      { table: "committees", column: "status", defaultVal: "active" },
      { table: "events", column: "event_type", defaultVal: "badger" },
      { table: "event_assignments", column: "category" },
      { table: "contacts", column: "type", defaultVal: "person" },
      { table: "contacts", column: "status", defaultVal: "active" },
      { table: "contacts", column: "ok_to_email", defaultVal: "unknown" },
      { table: "contacts", column: "ok_to_mail", defaultVal: "unknown" },
      { table: "contacts", column: "ok_to_sms", defaultVal: "unknown" },
      { table: "members", column: "position" },
      { table: "contact_photos", column: "type", defaultVal: "contact" },
      { table: "contact_emails", column: "type", defaultVal: "other" },
      { table: "contact_phones", column: "type", defaultVal: "other" },
      { table: "contact_addresses", column: "type", defaultVal: "home" },
      { table: "mailing_lists", column: "list_type", defaultVal: "static" },
      { table: "mailing_lists", column: "delivery_type", defaultVal: "both" },
      { table: "mailing_list_members", column: "source", defaultVal: "manual" },
      { table: "mailing_batch_recipients", column: "status", defaultVal: "queued" },
    ];

    for (const { table, column, defaultVal } of reversions) {
      if (defaultVal) {
        await queryRunner.query(`ALTER TABLE ${table} ALTER COLUMN ${column} DROP DEFAULT`);
      }
      await queryRunner.query(
        `ALTER TABLE ${table} ALTER COLUMN ${column} TYPE TEXT USING ${column}::text`,
      );
      if (defaultVal) {
        await queryRunner.query(
          `ALTER TABLE ${table} ALTER COLUMN ${column} SET DEFAULT '${defaultVal}'`,
        );
      }
    }

    // Re-add CHECK constraints
    await queryRunner.query(
      `ALTER TABLE contacts ADD CONSTRAINT contacts_type_check CHECK (type IN ('person', 'organization'))`,
    );
    await queryRunner.query(
      `ALTER TABLE contacts ADD CONSTRAINT contacts_status_check CHECK (status IN ('active', 'inactive', 'deleted'))`,
    );
    await queryRunner.query(
      `ALTER TABLE contacts ADD CONSTRAINT contacts_ok_to_email_check CHECK (ok_to_email IN ('yes', 'no', 'unknown'))`,
    );
    await queryRunner.query(
      `ALTER TABLE contacts ADD CONSTRAINT contacts_ok_to_mail_check CHECK (ok_to_mail IN ('yes', 'no', 'unknown'))`,
    );
    await queryRunner.query(
      `ALTER TABLE contacts ADD CONSTRAINT contacts_ok_to_sms_check CHECK (ok_to_sms IN ('yes', 'no', 'unknown'))`,
    );
    await queryRunner.query(
      `ALTER TABLE contact_emails ADD CONSTRAINT contact_emails_type_check CHECK (type IN ('work', 'home', 'other'))`,
    );
    await queryRunner.query(
      `ALTER TABLE contact_phones ADD CONSTRAINT contact_phones_type_check CHECK (type IN ('work', 'home', 'cell', 'other'))`,
    );
    await queryRunner.query(
      `ALTER TABLE contact_addresses ADD CONSTRAINT contact_addresses_type_check CHECK (type IN ('home', 'work', 'postal', 'other'))`,
    );
    await queryRunner.query(
      `ALTER TABLE event_assignments ADD CONSTRAINT event_assignments_category_check CHECK (category IN ('planning', 'during'))`,
    );
    await queryRunner.query(
      `ALTER TABLE mailing_lists ADD CONSTRAINT mailing_lists_list_type_check CHECK (list_type IN ('static', 'dynamic', 'hybrid'))`,
    );
    await queryRunner.query(
      `ALTER TABLE mailing_lists ADD CONSTRAINT mailing_lists_delivery_type_check CHECK (delivery_type IN ('physical', 'email', 'both'))`,
    );
    await queryRunner.query(
      `ALTER TABLE mailing_list_members ADD CONSTRAINT mailing_list_members_source_check CHECK (source IN ('manual', 'import', 'rule'))`,
    );
    await queryRunner.query(
      `ALTER TABLE mailing_batch_recipients ADD CONSTRAINT mailing_batch_recipients_status_check CHECK (status IN ('queued', 'printed', 'mailed', 'returned', 'invalid'))`,
    );

    // Drop ENUM types
    const enumTypes = [
      "motion_result_enum",
      "action_item_status_enum",
      "old_business_status_enum",
      "meeting_template_type_enum",
      "committee_status_enum",
      "event_type_enum",
      "event_assignment_category_enum",
      "contact_type_enum",
      "contact_status_enum",
      "consent_status_enum",
      "member_position_enum",
      "contact_photo_type_enum",
      "contact_email_type_enum",
      "contact_phone_type_enum",
      "contact_address_type_enum",
      "mailing_list_type_enum",
      "mailing_delivery_type_enum",
      "mailing_member_source_enum",
      "mailing_recipient_status_enum",
    ];
    for (const t of enumTypes) {
      await queryRunner.query(`DROP TYPE IF EXISTS ${t}`);
    }
  }
}
