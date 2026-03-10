import type { MigrationInterface } from "typeorm";
import type { QueryRunner } from "typeorm";

const ALL_MEMBERS_ID = "00000000-0000-0000-0000-000000000001";

/**
 * Initial schema: all tables and the required "All Members" row.
 * Future schema changes should be new migrations in this directory.
 */
export class InitialSchema1700000000000 implements MigrationInterface {
  name = "InitialSchema1700000000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        year INTEGER,
        created_at TEXT DEFAULT (datetime('now')),
        event_date TEXT,
        event_url TEXT,
        event_location TEXT,
        event_location_embed TEXT,
        ga_ticket_cost REAL,
        day_pass_cost REAL,
        ga_tickets_sold REAL,
        day_passes_sold REAL,
        budget_id TEXT,
        scenario_id TEXT,
        planning_notes TEXT
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS event_planning_milestones (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        month INTEGER NOT NULL,
        year INTEGER NOT NULL,
        description TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0,
        completed INTEGER,
        due_date TEXT,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS members (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone_number TEXT,
        address TEXT,
        birthday TEXT,
        emergency_contact_name TEXT,
        emergency_contact_phone TEXT,
        photo BLOB,
        created_at TEXT DEFAULT (datetime('now')),
        position TEXT,
        email TEXT,
        member_since TEXT,
        is_baby INTEGER
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS event_milestone_members (
        id TEXT PRIMARY KEY,
        milestone_id TEXT NOT NULL,
        member_id TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0,
        FOREIGN KEY (milestone_id) REFERENCES event_planning_milestones(id) ON DELETE CASCADE,
        FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
        UNIQUE(milestone_id, member_id)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS event_packing_categories (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        name TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS event_packing_items (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        category_id TEXT NOT NULL,
        name TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0,
        quantity INTEGER,
        note TEXT,
        loaded INTEGER DEFAULT 0,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES event_packing_categories(id) ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS event_volunteers (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        name TEXT NOT NULL,
        department TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS event_assignments (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL CHECK (category IN ('planning', 'during')),
        sort_order INTEGER DEFAULT 0,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS event_assignment_members (
        id TEXT PRIMARY KEY,
        assignment_id TEXT NOT NULL,
        member_id TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0,
        FOREIGN KEY (assignment_id) REFERENCES event_assignments(id) ON DELETE CASCADE,
        FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
        UNIQUE(assignment_id, member_id)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS budgets (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        year INTEGER NOT NULL,
        description TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS line_items (
        id TEXT PRIMARY KEY,
        budget_id TEXT NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        comments TEXT,
        unit_cost REAL NOT NULL,
        quantity REAL NOT NULL,
        historical_costs TEXT,
        FOREIGN KEY (budget_id) REFERENCES budgets(id) ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS scenarios (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        inputs TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);
    await queryRunner.query("INSERT OR IGNORE INTO members (id, name) VALUES (?, ?)", [
      ALL_MEMBERS_ID,
      "All Members",
    ]);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK (type IN ('person', 'organization')) DEFAULT 'person',
        status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'deleted')) DEFAULT 'active',
        display_name TEXT NOT NULL,
        first_name TEXT,
        last_name TEXT,
        organization_name TEXT,
        notes TEXT,
        how_we_know_them TEXT,
        ok_to_email TEXT CHECK (ok_to_email IN ('yes', 'no', 'unknown')) DEFAULT 'unknown',
        ok_to_mail TEXT CHECK (ok_to_mail IN ('yes', 'no', 'unknown')) DEFAULT 'unknown',
        do_not_contact INTEGER DEFAULT 0,
        club_name TEXT,
        role TEXT,
        uid TEXT UNIQUE,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        deleted_at TEXT
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS contact_emails (
        id TEXT PRIMARY KEY,
        contact_id TEXT NOT NULL,
        email TEXT NOT NULL,
        type TEXT CHECK (type IN ('work', 'home', 'other')) DEFAULT 'other',
        is_primary INTEGER DEFAULT 0,
        FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS contact_phones (
        id TEXT PRIMARY KEY,
        contact_id TEXT NOT NULL,
        phone TEXT NOT NULL,
        type TEXT CHECK (type IN ('work', 'home', 'cell', 'other')) DEFAULT 'other',
        is_primary INTEGER DEFAULT 0,
        FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS contact_addresses (
        id TEXT PRIMARY KEY,
        contact_id TEXT NOT NULL,
        address_line1 TEXT,
        address_line2 TEXT,
        city TEXT,
        state TEXT,
        postal_code TEXT,
        country TEXT DEFAULT 'US',
        type TEXT CHECK (type IN ('home', 'work', 'postal', 'other')) DEFAULT 'home',
        is_primary_mailing INTEGER DEFAULT 0,
        FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS contact_tags (
        contact_id TEXT NOT NULL,
        tag_id TEXT NOT NULL,
        PRIMARY KEY (contact_id, tag_id),
        FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS mailing_lists (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        list_type TEXT NOT NULL CHECK (list_type IN ('static', 'dynamic', 'hybrid')) DEFAULT 'static',
        event_id TEXT,
        template TEXT,
        criteria TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS mailing_list_members (
        id TEXT PRIMARY KEY,
        list_id TEXT NOT NULL,
        contact_id TEXT NOT NULL,
        added_by TEXT,
        added_at TEXT DEFAULT (datetime('now')),
        source TEXT CHECK (source IN ('manual', 'import', 'rule')) DEFAULT 'manual',
        suppressed INTEGER DEFAULT 0,
        suppress_reason TEXT,
        unsubscribed INTEGER DEFAULT 0,
        FOREIGN KEY (list_id) REFERENCES mailing_lists(id) ON DELETE CASCADE,
        FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
        UNIQUE(list_id, contact_id)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS mailing_batches (
        id TEXT PRIMARY KEY,
        list_id TEXT NOT NULL,
        event_id TEXT,
        name TEXT NOT NULL,
        created_by TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        recipient_count INTEGER DEFAULT 0,
        FOREIGN KEY (list_id) REFERENCES mailing_lists(id) ON DELETE CASCADE,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS mailing_batch_recipients (
        id TEXT PRIMARY KEY,
        batch_id TEXT NOT NULL,
        contact_id TEXT NOT NULL,
        snapshot_name TEXT NOT NULL,
        snapshot_address_line1 TEXT,
        snapshot_address_line2 TEXT,
        snapshot_city TEXT,
        snapshot_state TEXT,
        snapshot_postal_code TEXT,
        snapshot_country TEXT,
        snapshot_organization TEXT,
        status TEXT NOT NULL CHECK (status IN ('queued', 'printed', 'mailed', 'returned', 'invalid')) DEFAULT 'queued',
        invalid_reason TEXT,
        returned_reason TEXT,
        FOREIGN KEY (batch_id) REFERENCES mailing_batches(id) ON DELETE CASCADE,
        FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE IF EXISTS mailing_batch_recipients");
    await queryRunner.query("DROP TABLE IF EXISTS mailing_batches");
    await queryRunner.query("DROP TABLE IF EXISTS mailing_list_members");
    await queryRunner.query("DROP TABLE IF EXISTS mailing_lists");
    await queryRunner.query("DROP TABLE IF EXISTS contact_tags");
    await queryRunner.query("DROP TABLE IF EXISTS tags");
    await queryRunner.query("DROP TABLE IF EXISTS contact_addresses");
    await queryRunner.query("DROP TABLE IF EXISTS contact_phones");
    await queryRunner.query("DROP TABLE IF EXISTS contact_emails");
    await queryRunner.query("DROP TABLE IF EXISTS contacts");
    await queryRunner.query("DROP TABLE IF EXISTS scenarios");
    await queryRunner.query("DROP TABLE IF EXISTS line_items");
    await queryRunner.query("DROP TABLE IF EXISTS budgets");
    await queryRunner.query("DROP TABLE IF EXISTS event_assignment_members");
    await queryRunner.query("DROP TABLE IF EXISTS event_assignments");
    await queryRunner.query("DROP TABLE IF EXISTS event_volunteers");
    await queryRunner.query("DROP TABLE IF EXISTS event_packing_items");
    await queryRunner.query("DROP TABLE IF EXISTS event_packing_categories");
    await queryRunner.query("DROP TABLE IF EXISTS event_milestone_members");
    await queryRunner.query("DROP TABLE IF EXISTS members");
    await queryRunner.query("DROP TABLE IF EXISTS event_planning_milestones");
    await queryRunner.query("DROP TABLE IF EXISTS events");
  }
}
