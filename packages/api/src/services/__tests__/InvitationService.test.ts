import { describe, test, expect, beforeAll } from "bun:test";
import type { DataSource } from "typeorm";
import { setupTestDb } from "../../test/setup";
import type { Api } from "../api";
import { InvitationPurpose } from "@satyrsmc/shared/lib/enums";
import { createEvent, createContact, createUser } from "./helpers";

describe("InvitationService", () => {
  let api: Api;
  let ds: DataSource;

  beforeAll(async () => {
    const result = await setupTestDb();
    api = result.api;
    ds = result.ds;
  });

  describe("create", () => {
    test("creates an invitation with raw token", async () => {
      const event = await createEvent(api);
      const result = await api.invitations.create({
        purpose: InvitationPurpose.EventOpenRegistration,
        eventId: event.id,
        expiresInDays: 30,
      });

      expect(result.id).toBeDefined();
      expect(result.rawToken).toBeDefined();
      expect(result.rawToken.length).toBe(36); // UUID v5 format
      expect(result.purpose).toBe(InvitationPurpose.EventOpenRegistration);
      expect(result.eventId).toBe(event.id);
      expect(result.contactId).toBeNull();
      expect(result.claimedAt).toBeNull();
    });

    test("creates a per-contact invitation", async () => {
      const contact = await createContact(api);
      const result = await api.invitations.create({
        contactId: contact.id,
        purpose: InvitationPurpose.AccountSetup,
        expiresInDays: 7,
      });

      expect(result.contactId).toBe(contact.id);
      expect(result.purpose).toBe(InvitationPurpose.AccountSetup);
    });
  });

  describe("findByRawToken", () => {
    test("finds invitation by raw token", async () => {
      const event = await createEvent(api);
      const created = await api.invitations.create({
        purpose: InvitationPurpose.EventOpenRegistration,
        eventId: event.id,
      });

      const found = await api.invitations.findByRawToken(created.rawToken);
      expect(found).not.toBeNull();
      expect(found!.id).toBe(created.id);
      expect(found!.purpose).toBe(InvitationPurpose.EventOpenRegistration);
    });

    test("returns null for invalid token", async () => {
      const found = await api.invitations.findByRawToken("nonexistent-token");
      expect(found).toBeNull();
    });
  });

  describe("isValid", () => {
    test("returns true for valid non-expired token", async () => {
      const event = await createEvent(api);
      const created = await api.invitations.create({
        purpose: InvitationPurpose.EventOpenRegistration,
        eventId: event.id,
        expiresInDays: 30,
      });

      const valid = await api.invitations.isValid(created.rawToken);
      expect(valid).toBe(true);
    });

    test("returns false for non-existent token", async () => {
      const valid = await api.invitations.isValid("fake-token");
      expect(valid).toBe(false);
    });
  });

  describe("claimForRegistration", () => {
    test("marks invitation as claimed with rsvp link", async () => {
      const event = await createEvent(api);
      const contact = await createContact(api);

      // Create a per-contact invitation
      const created = await api.invitations.create({
        contactId: contact.id,
        purpose: InvitationPurpose.EventRegistration,
        eventId: event.id,
      });

      // Create a real user + RSVP to satisfy FK
      const { userId } = await createUser(ds, api, { contactId: contact.id });
      const rsvp = await api.rsvps.createAuthRsvp(contact.id, userId, {
        eventId: event.id,
        waiverContentHash: "hash",
        waiverIp: "127.0.0.1",
        waiverUserAgent: null,
      });

      await api.invitations.claimForRegistration(created.rawToken, rsvp.id);

      const found = await api.invitations.findByRawToken(created.rawToken);
      expect(found).not.toBeNull();
      expect(found!.claimedAt).not.toBeNull();
      expect(found!.rsvpId).toBe(rsvp.id);
    });
  });

  describe("claimForAccount", () => {
    test("marks invitation as claimed with user link", async () => {
      const contact = await createContact(api);
      const { userId } = await createUser(ds, api, { contactId: contact.id });

      const created = await api.invitations.create({
        contactId: contact.id,
        purpose: InvitationPurpose.AccountSetup,
      });

      await api.invitations.claimForAccount(created.rawToken, userId);

      const found = await api.invitations.findByRawToken(created.rawToken);
      expect(found).not.toBeNull();
      expect(found!.claimedAt).not.toBeNull();
      expect(found!.createdUserId).toBe(userId);
    });
  });

  describe("findByEvent", () => {
    test("returns invitations for an event", async () => {
      const event = await createEvent(api);
      await api.invitations.create({
        purpose: InvitationPurpose.EventOpenRegistration,
        eventId: event.id,
      });

      const results = await api.invitations.findByEvent(event.id);
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0]!.eventId).toBe(event.id);
    });
  });

  describe("findUnclaimedByContact", () => {
    test("returns only unclaimed invitations", async () => {
      const contact = await createContact(api);
      const { userId } = await createUser(ds, api, { contactId: contact.id });

      // Create unclaimed
      await api.invitations.create({
        contactId: contact.id,
        purpose: InvitationPurpose.AccountSetup,
      });

      // Create and claim
      const claimed = await api.invitations.create({
        contactId: contact.id,
        purpose: InvitationPurpose.AccountSetup,
      });
      await api.invitations.claimForAccount(claimed.rawToken, userId);

      const results = await api.invitations.findUnclaimedByContact(contact.id);
      expect(results.length).toBe(1);
      expect(results[0]!.claimedAt).toBeNull();
    });
  });
});
