import { t } from "./trpc";
import { websiteRouter } from "./routers/website";
import { adminRouter } from "./routers/admin";
import { authRouter } from "./routers/auth";

export const appRouter = t.router({
  website: websiteRouter,
  admin: adminRouter,
  auth: authRouter,
});

export type AppRouter = typeof appRouter;
