import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { setupTestDb, teardownTestDb } from "../../test/setup";
import type { DataSource } from "typeorm";

describe("Auth migrations", () => {
  let ds: DataSource;

  beforeAll(async () => {
    const result = await setupTestDb();
    ds = result.ds;
  });

  afterAll(async () => {
    await teardownTestDb(ds);
  });

  describe("AddContactIdToMembers migration", () => {
    test("members table has contact_id column", async () => {
      const columns: Array<{ column_name: string }> = await ds.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'members' AND column_name = 'contact_id'
      `);
      expect(columns.length).toBe(1);
    });

    test("contact_id FK references contacts table", async () => {
      const contactId = crypto.randomUUID();
      await ds.query(
        `INSERT INTO contacts (id, type, status, display_name) VALUES ($1, 'person', 'active', 'Test')`,
        [contactId],
      );

      const memberId = crypto.randomUUID();
      await ds.query(`INSERT INTO members (id, contact_id) VALUES ($1, $2)`, [memberId, contactId]);

      const result = await ds.query(`SELECT contact_id FROM members WHERE id = $1`, [memberId]);
      expect(result[0].contact_id).toBe(contactId);
    });

    test("contact_id FK rejects invalid reference", async () => {
      const memberId = crypto.randomUUID();
      await expect(
        ds.query(`INSERT INTO members (id, contact_id) VALUES ($1, $2)`, [
          memberId,
          "nonexistent-id",
        ]),
      ).rejects.toThrow();
    });

    test("contact_id is NOT NULL", async () => {
      const memberId = crypto.randomUUID();
      await expect(
        ds.query(`INSERT INTO members (id, contact_id) VALUES ($1, NULL)`, [memberId]),
      ).rejects.toThrow();
    });
  });

  describe("CreateUsersAndRegistrations migration", () => {
    test("users table exists with expected columns", async () => {
      const columns: Array<{ column_name: string }> = await ds.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'users'
        ORDER BY column_name
      `);
      const colNames = columns.map((c) => c.column_name);
      expect(colNames).toContain("id");
      expect(colNames).toContain("contact_id");
      expect(colNames).toContain("member_id");
      expect(colNames).toContain("username");
      expect(colNames).toContain("password_hash");
      expect(colNames).toContain("user_type");
      expect(colNames).toContain("user_status");
      expect(colNames).toContain("last_login");
      expect(colNames).toContain("failed_login_attempts");
      expect(colNames).toContain("locked_until");
      expect(colNames).toContain("reset_token_hash");
      expect(colNames).toContain("reset_token_expires_at");
      expect(colNames).toContain("password_changed_at");
      expect(colNames).toContain("admin_note");
      expect(colNames).toContain("created_at");
      expect(colNames).toContain("updated_at");
    });

    test("registrations table exists with expected columns", async () => {
      const columns: Array<{ column_name: string }> = await ds.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'registrations'
        ORDER BY column_name
      `);
      const colNames = columns.map((c) => c.column_name);
      expect(colNames).toContain("id");
      expect(colNames).toContain("email");
      expect(colNames).toContain("first_name");
      expect(colNames).toContain("last_name");
      expect(colNames).toContain("token_hash");
      expect(colNames).toContain("expires_at");
      expect(colNames).toContain("contact_id");
      expect(colNames).toContain("member_id");
      expect(colNames).toContain("invited_by");
      expect(colNames).toContain("created_at");
    });

    test("user_type_enum and user_status_enum exist", async () => {
      const enums: Array<{ typname: string }> = await ds.query(`
        SELECT typname FROM pg_type WHERE typname IN ('user_type_enum', 'user_status_enum')
      `);
      const names = enums.map((e) => e.typname);
      expect(names).toContain("user_type_enum");
      expect(names).toContain("user_status_enum");
    });

    test("can insert and read a user", async () => {
      const contactId = crypto.randomUUID();
      await ds.query(
        `INSERT INTO contacts (id, type, status, display_name) VALUES ($1, 'person', 'active', 'User Contact')`,
        [contactId],
      );

      const userId = crypto.randomUUID();
      await ds.query(
        `INSERT INTO users (id, contact_id, username, password_hash) VALUES ($1, $2, $3, $4)`,
        [userId, contactId, "testuser", "hash123"],
      );

      const result = await ds.query(`SELECT * FROM users WHERE id = $1`, [userId]);
      expect(result.length).toBe(1);
      expect(result[0].username).toBe("testuser");
      expect(result[0].user_type).toBe("user");
      expect(result[0].user_status).toBe("locked");
      expect(result[0].failed_login_attempts).toBe(0);
    });

    test("username uniqueness constraint works", async () => {
      const contactId = crypto.randomUUID();
      await ds.query(
        `INSERT INTO contacts (id, type, status, display_name) VALUES ($1, 'person', 'active', 'Dup Contact')`,
        [contactId],
      );

      await ds.query(
        `INSERT INTO users (id, contact_id, username, password_hash) VALUES ($1, $2, 'uniqueuser', 'hash')`,
        [crypto.randomUUID(), contactId],
      );

      await expect(
        ds.query(
          `INSERT INTO users (id, contact_id, username, password_hash) VALUES ($1, $2, 'uniqueuser', 'hash')`,
          [crypto.randomUUID(), contactId],
        ),
      ).rejects.toThrow();
    });

    test("users.contact_id FK is enforced (NOT NULL)", async () => {
      await expect(
        ds.query(
          `INSERT INTO users (id, contact_id, username, password_hash) VALUES ($1, NULL, 'nocontact', 'hash')`,
          [crypto.randomUUID()],
        ),
      ).rejects.toThrow();
    });

    test("users.member_id FK is nullable", async () => {
      const contactId = crypto.randomUUID();
      await ds.query(
        `INSERT INTO contacts (id, type, status, display_name) VALUES ($1, 'person', 'active', 'No Member')`,
        [contactId],
      );

      const userId = crypto.randomUUID();
      await ds.query(
        `INSERT INTO users (id, contact_id, member_id, username, password_hash) VALUES ($1, $2, NULL, $3, 'hash')`,
        [userId, contactId, `nullmember-${Date.now()}`],
      );

      const result = await ds.query(`SELECT member_id FROM users WHERE id = $1`, [userId]);
      expect(result[0].member_id).toBeNull();
    });

    test("can insert a registration", async () => {
      const regId = crypto.randomUUID();
      await ds.query(
        `INSERT INTO registrations (id, email, token_hash, expires_at) VALUES ($1, $2, $3, $4)`,
        [regId, "test@example.com", "tokenhash123", new Date(Date.now() + 86400000).toISOString()],
      );

      const result = await ds.query(`SELECT * FROM registrations WHERE id = $1`, [regId]);
      expect(result.length).toBe(1);
      expect(result[0].email).toBe("test@example.com");
    });

    test("registrations.invited_by FK references users", async () => {
      const contactId = crypto.randomUUID();
      await ds.query(
        `INSERT INTO contacts (id, type, status, display_name) VALUES ($1, 'person', 'active', 'Inviter')`,
        [contactId],
      );

      const inviterId = crypto.randomUUID();
      await ds.query(
        `INSERT INTO users (id, contact_id, username, password_hash, user_status) VALUES ($1, $2, $3, 'hash', 'active')`,
        [inviterId, contactId, `inviter-${Date.now()}`],
      );

      const regId = crypto.randomUUID();
      await ds.query(
        `INSERT INTO registrations (id, email, token_hash, expires_at, invited_by) VALUES ($1, $2, $3, $4, $5)`,
        [
          regId,
          "invited@example.com",
          "hash",
          new Date(Date.now() + 86400000).toISOString(),
          inviterId,
        ],
      );

      const result = await ds.query(`SELECT invited_by FROM registrations WHERE id = $1`, [regId]);
      expect(result[0].invited_by).toBe(inviterId);
    });
  });

  describe("DropRedundantMemberColumns migration", () => {
    test("members table no longer has flat contact columns", async () => {
      const columns: Array<{ column_name: string }> = await ds.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'members'
        ORDER BY column_name
      `);
      const colNames = columns.map((c) => c.column_name);
      expect(colNames).not.toContain("name");
      expect(colNames).not.toContain("email");
      expect(colNames).not.toContain("phone_number");
      expect(colNames).not.toContain("address");
      expect(colNames).not.toContain("emergency_contact_name");
      expect(colNames).not.toContain("emergency_contact_phone");
      expect(colNames).not.toContain("photo");
      expect(colNames).not.toContain("photo_thumbnail");
      // Still has member-specific columns
      expect(colNames).toContain("id");
      expect(colNames).toContain("contact_id");
      expect(colNames).not.toContain("birthday"); // birthday moved to contacts table
      expect(colNames).toContain("member_since");
      expect(colNames).toContain("is_baby");
      expect(colNames).toContain("position");
      expect(colNames).toContain("show_on_website");
    });

    test("member-contact link allows querying contact info through FK", async () => {
      const contactId = crypto.randomUUID();
      await ds.query(
        `INSERT INTO contacts (id, type, status, display_name, first_name, last_name)
         VALUES ($1, 'person', 'active', 'Linked Member', 'Linked', 'Member')`,
        [contactId],
      );
      await ds.query(
        `INSERT INTO contact_phones (id, contact_id, phone, type, is_primary)
         VALUES ($1, $2, '555-0000', 'cell', true)`,
        [crypto.randomUUID(), contactId],
      );

      const memberId = crypto.randomUUID();
      await ds.query(`INSERT INTO members (id, contact_id) VALUES ($1, $2)`, [memberId, contactId]);

      // Join query to get contact display_name + phone
      const result = await ds.query(
        `SELECT c.display_name, cp.phone FROM members m
         JOIN contacts c ON c.id = m.contact_id
         JOIN contact_phones cp ON cp.contact_id = m.contact_id
         WHERE m.id = $1`,
        [memberId],
      );
      expect(result.length).toBe(1);
      expect(result[0].display_name).toBe("Linked Member");
      expect(result[0].phone).toBe("555-0000");
    });
  });
});
