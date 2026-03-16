import { t } from "./trpc";
import { websiteRouter } from "./routers/website";
import { adminRouter } from "./routers/admin";
import { authRouter } from "./routers/auth";
import { membersRouter } from "./routers/members";

export const appRouter = t.router({
  website: websiteRouter,
  admin: adminRouter,
  auth: authRouter,
  members: membersRouter,
});

export type AppRouter = typeof appRouter;
