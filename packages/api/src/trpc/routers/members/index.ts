import { t } from "../../trpc";
import { memberEventsRouter } from "./events";

export const membersRouter = t.router({
  events: memberEventsRouter,
});
