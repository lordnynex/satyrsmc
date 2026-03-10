import type { MigrationInterface, QueryRunner } from "typeorm";

const ALL_MEMBERS_ID = "00000000-0000-0000-0000-000000000001";

/**
 * Postgres baseline migration — creates the full schema from scratch.
 * This replaces all prior SQLite migrations with Postgres-native types.
 */
export class PostgresBaseline1800000000000 implements MigrationInterface {
  name = "PostgresBaseline1800000000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    // ── events ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        year INTEGER,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        event_date TIMESTAMPTZ,
        event_url TEXT,
        event_location TEXT,
        event_location_embed TEXT,
        ga_ticket_cost REAL,
        day_pass_cost REAL,
        ga_tickets_sold REAL,
        day_passes_sold REAL,
        budget_id TEXT,
        scenario_id TEXT,
        planning_notes TEXT,
        event_type TEXT NOT NULL DEFAULT 'badger',
        start_location TEXT,
        end_location TEXT,
        facebook_event_url TEXT,
        pre_ride_event_id TEXT,
        ride_cost REAL,
        show_on_website BOOLEAN NOT NULL DEFAULT FALSE
      )
    `);

    // ── members ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS members (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone_number TEXT,
        address TEXT,
        birthday TIMESTAMPTZ,
        emergency_contact_name TEXT,
        emergency_contact_phone TEXT,
        photo BYTEA,
        photo_thumbnail BYTEA,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        position TEXT,
        email TEXT,
        member_since TIMESTAMPTZ,
        is_baby BOOLEAN NOT NULL DEFAULT FALSE,
        show_on_website BOOLEAN NOT NULL DEFAULT FALSE
      )
    `);

    // ── event_planning_milestones ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS event_planning_milestones (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        month INTEGER NOT NULL,
        year INTEGER NOT NULL,
        description TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0,
        completed BOOLEAN NOT NULL DEFAULT FALSE,
        due_date TIMESTAMPTZ
      )
    `);

    // ── event_milestone_members ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS event_milestone_members (
        id TEXT PRIMARY KEY,
        milestone_id TEXT NOT NULL REFERENCES event_planning_milestones(id) ON DELETE CASCADE,
        member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        sort_order INTEGER DEFAULT 0,
        UNIQUE(milestone_id, member_id)
      )
    `);

    // ── event_packing_categories ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS event_packing_categories (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0
      )
    `);

    // ── event_packing_items ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS event_packing_items (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        category_id TEXT NOT NULL REFERENCES event_packing_categories(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0,
        quantity INTEGER,
        note TEXT,
        loaded BOOLEAN NOT NULL DEFAULT FALSE
      )
    `);

    // ── event_volunteers ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS event_volunteers (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        department TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0
      )
    `);

    // ── event_assignments ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS event_assignments (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        category TEXT NOT NULL CHECK (category IN ('planning', 'during')),
        sort_order INTEGER DEFAULT 0
      )
    `);

    // ── event_assignment_members ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS event_assignment_members (
        id TEXT PRIMARY KEY,
        assignment_id TEXT NOT NULL REFERENCES event_assignments(id) ON DELETE CASCADE,
        member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        sort_order INTEGER DEFAULT 0,
        UNIQUE(assignment_id, member_id)
      )
    `);

    // ── event_attendees ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS event_attendees (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
        sort_order INTEGER NOT NULL DEFAULT 0,
        waiver_signed BOOLEAN NOT NULL DEFAULT FALSE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_event_attendees_event_id ON event_attendees(event_id)
    `);

    // ── event_ride_member_attendees ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS event_ride_member_attendees (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        sort_order INTEGER NOT NULL DEFAULT 0,
        waiver_signed BOOLEAN NOT NULL DEFAULT FALSE,
        UNIQUE(event_id, member_id)
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_event_ride_member_attendees_event_id ON event_ride_member_attendees(event_id)
    `);

    // ── event_photos ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS event_photos (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        sort_order INTEGER NOT NULL DEFAULT 0,
        photo BYTEA,
        photo_thumbnail BYTEA,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_event_photos_event_id ON event_photos(event_id)
    `);

    // ── event_assets ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS event_assets (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        sort_order INTEGER NOT NULL DEFAULT 0,
        photo BYTEA,
        photo_thumbnail BYTEA,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_event_assets_event_id ON event_assets(event_id)
    `);

    // ── ride_schedule_items ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ride_schedule_items (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        scheduled_time TIMESTAMPTZ,
        label TEXT NOT NULL,
        location TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_ride_schedule_items_event_id ON ride_schedule_items(event_id)
    `);

    // ── budgets ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS budgets (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        year INTEGER NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ── line_items ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS line_items (
        id TEXT PRIMARY KEY,
        budget_id TEXT NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        comments TEXT,
        unit_cost REAL NOT NULL,
        quantity REAL NOT NULL,
        historical_costs TEXT
      )
    `);

    // ── scenarios ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS scenarios (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        inputs TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ── contacts ──
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
        ok_to_sms TEXT CHECK (ok_to_sms IN ('yes', 'no', 'unknown')) DEFAULT 'unknown',
        do_not_contact BOOLEAN NOT NULL DEFAULT FALSE,
        club_name TEXT,
        role TEXT,
        uid TEXT UNIQUE,
        hellenic BOOLEAN NOT NULL DEFAULT FALSE,
        deceased BOOLEAN NOT NULL DEFAULT FALSE,
        deceased_year INTEGER,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        deleted_at TIMESTAMPTZ
      )
    `);

    // ── contact_emails ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS contact_emails (
        id TEXT PRIMARY KEY,
        contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
        email TEXT NOT NULL,
        type TEXT CHECK (type IN ('work', 'home', 'other')) DEFAULT 'other',
        is_primary BOOLEAN NOT NULL DEFAULT FALSE
      )
    `);

    // ── contact_phones ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS contact_phones (
        id TEXT PRIMARY KEY,
        contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
        phone TEXT NOT NULL,
        type TEXT CHECK (type IN ('work', 'home', 'cell', 'other')) DEFAULT 'other',
        is_primary BOOLEAN NOT NULL DEFAULT FALSE
      )
    `);

    // ── contact_addresses ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS contact_addresses (
        id TEXT PRIMARY KEY,
        contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
        address_line1 TEXT,
        address_line2 TEXT,
        city TEXT,
        state TEXT,
        postal_code TEXT,
        country TEXT DEFAULT 'US',
        type TEXT CHECK (type IN ('home', 'work', 'postal', 'other')) DEFAULT 'home',
        is_primary_mailing BOOLEAN NOT NULL DEFAULT FALSE
      )
    `);

    // ── tags ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE
      )
    `);

    // ── contact_tags ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS contact_tags (
        contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
        tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
        PRIMARY KEY (contact_id, tag_id)
      )
    `);

    // ── contact_notes ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS contact_notes (
        id TEXT PRIMARY KEY,
        contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_contact_notes_contact_id ON contact_notes(contact_id)
    `);

    // ── contact_photos ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS contact_photos (
        id TEXT PRIMARY KEY,
        contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
        type TEXT NOT NULL DEFAULT 'contact',
        sort_order INTEGER NOT NULL DEFAULT 0,
        photo BYTEA,
        photo_thumbnail BYTEA,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_contact_photos_contact_id ON contact_photos(contact_id)
    `);

    // ── contact_emergency_contacts ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS contact_emergency_contacts (
        id TEXT PRIMARY KEY,
        contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        relationship TEXT
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_contact_emergency_contacts_contact_id ON contact_emergency_contacts(contact_id)
    `);

    // ── mailing_lists ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS mailing_lists (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        list_type TEXT NOT NULL CHECK (list_type IN ('static', 'dynamic', 'hybrid')) DEFAULT 'static',
        delivery_type TEXT NOT NULL DEFAULT 'both' CHECK (delivery_type IN ('physical', 'email', 'both')),
        event_id TEXT REFERENCES events(id) ON DELETE SET NULL,
        template TEXT,
        criteria TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ── mailing_list_members ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS mailing_list_members (
        id TEXT PRIMARY KEY,
        list_id TEXT NOT NULL REFERENCES mailing_lists(id) ON DELETE CASCADE,
        contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
        added_by TEXT,
        added_at TIMESTAMPTZ DEFAULT NOW(),
        source TEXT CHECK (source IN ('manual', 'import', 'rule')) DEFAULT 'manual',
        suppressed BOOLEAN NOT NULL DEFAULT FALSE,
        suppress_reason TEXT,
        unsubscribed BOOLEAN NOT NULL DEFAULT FALSE,
        UNIQUE(list_id, contact_id)
      )
    `);

    // ── mailing_batches ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS mailing_batches (
        id TEXT PRIMARY KEY,
        list_id TEXT NOT NULL REFERENCES mailing_lists(id) ON DELETE CASCADE,
        event_id TEXT REFERENCES events(id) ON DELETE SET NULL,
        name TEXT NOT NULL,
        created_by TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        recipient_count INTEGER DEFAULT 0
      )
    `);

    // ── mailing_batch_recipients ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS mailing_batch_recipients (
        id TEXT PRIMARY KEY,
        batch_id TEXT NOT NULL REFERENCES mailing_batches(id) ON DELETE CASCADE,
        contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
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
        returned_reason TEXT
      )
    `);

    // ── qr_codes ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS qr_codes (
        id TEXT PRIMARY KEY,
        name TEXT,
        url TEXT NOT NULL,
        config TEXT,
        image_data BYTEA,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ── documents ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ── document_versions ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS document_versions (
        id TEXT PRIMARY KEY,
        document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        version_number INTEGER NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(document_id, version_number)
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON document_versions(document_id)
    `);

    // ── meetings ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS meetings (
        id TEXT PRIMARY KEY,
        date TIMESTAMPTZ NOT NULL,
        meeting_number INTEGER NOT NULL,
        location TEXT,
        previous_meeting_id TEXT REFERENCES meetings(id) ON DELETE SET NULL,
        agenda_document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        minutes_document_id TEXT REFERENCES documents(id) ON DELETE SET NULL,
        start_time TIMESTAMPTZ,
        end_time TIMESTAMPTZ,
        video_conference_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(date)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_meetings_previous_meeting_id ON meetings(previous_meeting_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_meetings_agenda_document_id ON meetings(agenda_document_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_meetings_minutes_document_id ON meetings(minutes_document_id)`);

    // ── meeting_motions ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS meeting_motions (
        id TEXT PRIMARY KEY,
        meeting_id TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
        description TEXT,
        result TEXT NOT NULL,
        order_index INTEGER NOT NULL DEFAULT 0,
        mover_member_id TEXT REFERENCES members(id) ON DELETE SET NULL,
        seconder_member_id TEXT REFERENCES members(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_meeting_motions_meeting_id ON meeting_motions(meeting_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_meeting_motions_mover_member_id ON meeting_motions(mover_member_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_meeting_motions_seconder_member_id ON meeting_motions(seconder_member_id)`);

    // ── meeting_action_items ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS meeting_action_items (
        id TEXT PRIMARY KEY,
        meeting_id TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
        description TEXT NOT NULL,
        assignee_member_id TEXT REFERENCES members(id) ON DELETE SET NULL,
        due_date TIMESTAMPTZ,
        status TEXT NOT NULL DEFAULT 'open',
        completed_at TIMESTAMPTZ,
        order_index INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_meeting_action_items_meeting_id ON meeting_action_items(meeting_id)`);

    // ── old_business_items ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS old_business_items (
        id TEXT PRIMARY KEY,
        meeting_id TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
        description TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open',
        closed_at TIMESTAMPTZ,
        closed_in_meeting_id TEXT REFERENCES meetings(id) ON DELETE SET NULL,
        order_index INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_old_business_items_meeting_id ON old_business_items(meeting_id)`);

    // ── meeting_templates ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS meeting_templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_meeting_templates_type ON meeting_templates(type)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_meeting_templates_document_id ON meeting_templates(document_id)`);

    // ── committees ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS committees (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        purpose TEXT,
        formed_date TIMESTAMPTZ NOT NULL,
        closed_date TIMESTAMPTZ,
        chairperson_member_id TEXT REFERENCES members(id) ON DELETE SET NULL,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_committees_formed_date ON committees(formed_date)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_committees_status ON committees(status)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_committees_chairperson_member_id ON committees(chairperson_member_id)`);

    // ── committee_members ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS committee_members (
        id TEXT PRIMARY KEY,
        committee_id TEXT NOT NULL REFERENCES committees(id) ON DELETE CASCADE,
        member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        sort_order INTEGER NOT NULL DEFAULT 0,
        UNIQUE(committee_id, member_id)
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_committee_members_committee_id ON committee_members(committee_id)`);

    // ── committee_meetings ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS committee_meetings (
        id TEXT PRIMARY KEY,
        committee_id TEXT NOT NULL REFERENCES committees(id) ON DELETE CASCADE,
        date TIMESTAMPTZ NOT NULL,
        meeting_number INTEGER NOT NULL,
        location TEXT,
        previous_meeting_id TEXT REFERENCES committee_meetings(id) ON DELETE SET NULL,
        agenda_document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        minutes_document_id TEXT REFERENCES documents(id) ON DELETE SET NULL,
        start_time TIMESTAMPTZ,
        end_time TIMESTAMPTZ,
        video_conference_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_committee_meetings_committee_id ON committee_meetings(committee_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_committee_meetings_date ON committee_meetings(date)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_committee_meetings_previous_meeting_id ON committee_meetings(previous_meeting_id)`);

    // ── site_pages ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS site_pages (
        id TEXT PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        meta_title TEXT,
        meta_description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_site_pages_slug ON site_pages(slug)`);

    // ── site_settings ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS site_settings (
        id TEXT PRIMARY KEY DEFAULT 'default',
        title TEXT,
        logo_url TEXT,
        footer_text TEXT,
        default_meta_description TEXT,
        contact_email TEXT,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ── site_menu_items ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS site_menu_items (
        id TEXT PRIMARY KEY,
        menu_key TEXT NOT NULL,
        label TEXT NOT NULL,
        url TEXT,
        internal_ref TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_site_menu_items_menu_key ON site_menu_items(menu_key)`);

    // ── blog_posts ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS blog_posts (
        id TEXT PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        excerpt TEXT,
        body TEXT NOT NULL,
        published_at TIMESTAMPTZ,
        meta_title TEXT,
        meta_description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at)`);

    // ── contact_submissions ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS contact_submissions (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        subject TEXT,
        message TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'new',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ── contact_member_submissions ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS contact_member_submissions (
        id TEXT PRIMARY KEY,
        member_id TEXT NOT NULL,
        sender_name TEXT NOT NULL,
        sender_email TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'new',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ── incidents ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS incidents (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        contact_id TEXT REFERENCES contacts(id) ON DELETE SET NULL,
        member_id TEXT REFERENCES members(id) ON DELETE SET NULL,
        type TEXT NOT NULL,
        severity TEXT NOT NULL,
        summary TEXT NOT NULL,
        details TEXT,
        occurred_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_incidents_event_id ON incidents(event_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_incidents_contact_id ON incidents(contact_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_incidents_member_id ON incidents(member_id)`);

    // ── seed data ──
    await queryRunner.query(
      `INSERT INTO members (id, name) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [ALL_MEMBERS_ID, "All Members"]
    );
    await queryRunner.query(
      `INSERT INTO site_settings (id, title, updated_at) VALUES ('default', '', NOW()) ON CONFLICT DO NOTHING`
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const tables = [
      "incidents",
      "contact_member_submissions",
      "contact_submissions",
      "blog_posts",
      "site_menu_items",
      "site_settings",
      "site_pages",
      "committee_meetings",
      "committee_members",
      "committees",
      "meeting_templates",
      "old_business_items",
      "meeting_action_items",
      "meeting_motions",
      "meetings",
      "document_versions",
      "documents",
      "qr_codes",
      "mailing_batch_recipients",
      "mailing_batches",
      "mailing_list_members",
      "mailing_lists",
      "contact_emergency_contacts",
      "contact_photos",
      "contact_notes",
      "contact_tags",
      "tags",
      "contact_addresses",
      "contact_phones",
      "contact_emails",
      "contacts",
      "scenarios",
      "line_items",
      "budgets",
      "ride_schedule_items",
      "event_assets",
      "event_photos",
      "event_ride_member_attendees",
      "event_attendees",
      "event_assignment_members",
      "event_assignments",
      "event_volunteers",
      "event_packing_items",
      "event_packing_categories",
      "event_milestone_members",
      "event_planning_milestones",
      "members",
      "events",
    ];
    for (const table of tables) {
      await queryRunner.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
    }
  }
}
