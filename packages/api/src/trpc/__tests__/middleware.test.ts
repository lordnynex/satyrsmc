import { describe, test, expect, beforeAll } from "bun:test";
import type { TRPCError } from "@trpc/server";
import { t, protectedProcedure, adminProcedure, memberProcedure } from "../trpc";
import type { Context, Session } from "../context";
import { UserType } from "@satyrsmc/shared/lib/enums";
import { setupTestDb } from "../../test/setup";
import type { Api } from "../../services/api";

function makeContext(session: Session | null, api: Api): Context {
  return {
    req: new Request("http://test"),
    resHeaders: new Headers(),
    api,
    session,
  };
}

const userSession: Session = {
  userId: "user-1",
  userType: UserType.User,
  memberId: null,
  contactId: "contact-1",
};

const adminSession: Session = {
  userId: "admin-1",
  userType: UserType.Admin,
  memberId: null,
  contactId: "contact-2",
};

const webmasterSession: Session = {
  userId: "wm-1",
  userType: UserType.Webmaster,
  memberId: null,
  contactId: "contact-3",
};

const memberSession: Session = {
  userId: "member-1",
  userType: UserType.User,
  memberId: "member-id-1",
  contactId: "contact-4",
};

describe("tRPC middleware", () => {
  let api: Api;

  beforeAll(async () => {
    const result = await setupTestDb();
    api = result.api;
  });

  describe("protectedProcedure", () => {
    const router = t.router({
      test: protectedProcedure.query(({ ctx }) => ({ userId: ctx.session.userId })),
    });

    test("allows authenticated user", async () => {
      const caller = t.createCallerFactory(router)(makeContext(userSession, api));
      const result = await caller.test();
      expect(result.userId).toBe("user-1");
    });

    test("rejects unauthenticated request", async () => {
      const caller = t.createCallerFactory(router)(makeContext(null, api));
      try {
        await caller.test();
        expect(true).toBe(false); // Should not reach
      } catch (e) {
        expect((e as TRPCError).code).toBe("UNAUTHORIZED");
      }
    });
  });

  describe("adminProcedure", () => {
    const router = t.router({
      test: adminProcedure.query(({ ctx }) => ({ userId: ctx.session.userId })),
    });

    test("allows admin user", async () => {
      const caller = t.createCallerFactory(router)(makeContext(adminSession, api));
      const result = await caller.test();
      expect(result.userId).toBe("admin-1");
    });

    test("allows webmaster user", async () => {
      const caller = t.createCallerFactory(router)(makeContext(webmasterSession, api));
      const result = await caller.test();
      expect(result.userId).toBe("wm-1");
    });

    test("rejects regular user", async () => {
      const caller = t.createCallerFactory(router)(makeContext(userSession, api));
      try {
        await caller.test();
        expect(true).toBe(false);
      } catch (e) {
        expect((e as TRPCError).code).toBe("FORBIDDEN");
      }
    });

    test("rejects unauthenticated request", async () => {
      const caller = t.createCallerFactory(router)(makeContext(null, api));
      try {
        await caller.test();
        expect(true).toBe(false);
      } catch (e) {
        expect((e as TRPCError).code).toBe("UNAUTHORIZED");
      }
    });
  });

  describe("memberProcedure", () => {
    const router = t.router({
      test: memberProcedure.query(({ ctx }) => ({ userId: ctx.session.userId })),
    });

    test("allows member user", async () => {
      const caller = t.createCallerFactory(router)(makeContext(memberSession, api));
      const result = await caller.test();
      expect(result.userId).toBe("member-1");
    });

    test("allows admin even without memberId", async () => {
      const caller = t.createCallerFactory(router)(makeContext(adminSession, api));
      const result = await caller.test();
      expect(result.userId).toBe("admin-1");
    });

    test("allows webmaster even without memberId", async () => {
      const caller = t.createCallerFactory(router)(makeContext(webmasterSession, api));
      const result = await caller.test();
      expect(result.userId).toBe("wm-1");
    });

    test("rejects regular user without memberId", async () => {
      const caller = t.createCallerFactory(router)(makeContext(userSession, api));
      try {
        await caller.test();
        expect(true).toBe(false);
      } catch (e) {
        expect((e as TRPCError).code).toBe("FORBIDDEN");
      }
    });

    test("rejects unauthenticated request", async () => {
      const caller = t.createCallerFactory(router)(makeContext(null, api));
      try {
        await caller.test();
        expect(true).toBe(false);
      } catch (e) {
        expect((e as TRPCError).code).toBe("UNAUTHORIZED");
      }
    });
  });
});
