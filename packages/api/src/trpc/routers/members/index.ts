import { t } from "../../trpc";
import { memberEventsRouter } from "./events";
import { memberActivityLogsRouter } from "./activityLogs";

export const membersRouter = t.router({
  events: memberEventsRouter,
  activityLogs: memberActivityLogsRouter,
});
