import { initTRPC, TRPCError } from "@trpc/server";
import type { Context } from "./context";
import { UserType } from "@satyrsmc/shared/lib/enums";

export const t = initTRPC.context<Context>().create({
  errorFormatter: ({ shape, error }) => {
    if (error.code === "INTERNAL_SERVER_ERROR") {
      return {
        ...shape,
        message: "An internal server error occurred",
        data: { ...shape.data, stack: undefined },
      };
    }
    return { ...shape, data: { ...shape.data, stack: undefined } };
  },
});

/** Requires a valid session (any authenticated user). */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Authentication required" });
  }
  return next({ ctx: { ...ctx, session: ctx.session } });
});

/** Requires admin or webmaster role. */
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.session.userType !== UserType.Admin && ctx.session.userType !== UserType.Webmaster) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

/** Requires member (has memberId) or admin/webmaster role. */
export const memberProcedure = protectedProcedure.use(({ ctx, next }) => {
  const isAdmin =
    ctx.session.userType === UserType.Admin || ctx.session.userType === UserType.Webmaster;
  const isMember = ctx.session.memberId !== null;

  if (!isMember && !isAdmin) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Member access required" });
  }
  return next({ ctx });
});
