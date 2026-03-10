# Database migrations

Schema changes are managed with TypeORM migrations. Migrations run automatically on server startup (`migrationsRun: true` in the DataSource config).

## Adding a new migration

1. Create a new file in this directory named `{timestamp}-Description.ts`, e.g. `1800000001000-AddEventNotesColumn.ts`. Use a timestamp greater than existing migrations so it runs in order.

2. Implement `MigrationInterface`:

```ts
import type { MigrationInterface } from "typeorm";
import type { QueryRunner } from "typeorm";

export class AddEventNotesColumn1800000001000 implements MigrationInterface {
  name = "AddEventNotesColumn1800000001000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE events ADD COLUMN notes TEXT`
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE events DROP COLUMN notes`
    );
  }
}
```

3. In `dataSource.ts`, import the migration class and add it to the `migrations` array in `dataSourceOptions`.

4. Restart the server; the new migration will run once.

## Notes

- Use raw SQL in `up()` and `down()` with Postgres-native syntax.
- Use `TIMESTAMPTZ` for all date/time columns, `BOOLEAN` for booleans, `BYTEA` for binary data.
- TypeORM records applied migrations in a `migrations` table; do not edit or delete that table manually.
- The `sqlite-archive/` directory contains the original SQLite migrations for historical reference.
