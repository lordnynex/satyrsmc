import type { MigrationInterface, QueryRunner } from "typeorm";

export class CleanPaymentMethodEnum1800000017000 implements MigrationInterface {
  name = "CleanPaymentMethodEnum1800000017000";

  async up(queryRunner: QueryRunner): Promise<void> {
    // Rename 'stripe' → 'credit_card' (implementation-agnostic name)
    await queryRunner.query(
      `ALTER TYPE payment_method_enum RENAME VALUE 'stripe' TO 'credit_card'`,
    );

    // Remove 'money_order' — requires recreating the enum type since Postgres
    // does not support removing enum values directly.
    // No rows should have money_order (it was never used in production).
    await queryRunner.query(`ALTER TYPE payment_method_enum RENAME TO payment_method_enum_old`);
    await queryRunner.query(
      `CREATE TYPE payment_method_enum AS ENUM ('check', 'cash', 'zelle', 'credit_card')`,
    );
    await queryRunner.query(`
      ALTER TABLE event_attendees
        ALTER COLUMN payment_method TYPE payment_method_enum
        USING payment_method::text::payment_method_enum
    `);
    await queryRunner.query(`DROP TYPE payment_method_enum_old`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE payment_method_enum RENAME TO payment_method_enum_old`);
    await queryRunner.query(
      `CREATE TYPE payment_method_enum AS ENUM ('check', 'cash', 'zelle', 'money_order', 'stripe')`,
    );
    await queryRunner.query(`
      ALTER TABLE event_attendees
        ALTER COLUMN payment_method TYPE payment_method_enum
        USING payment_method::text::payment_method_enum
    `);
    await queryRunner.query(`DROP TYPE payment_method_enum_old`);
  }
}
