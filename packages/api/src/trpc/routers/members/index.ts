import { t } from "../../trpc";
import { memberEventsRouter } from "./events";
import { memberActivityLogsRouter } from "./activityLogs";
import { memberProfileRouter } from "./profile";
import { memberBikesRouter } from "./bikes";
import { memberSettingsRouter } from "./settings";
import { memberNotificationsRouter } from "./notifications";
import { memberRosterRouter } from "./roster";
import { memberRsvpRouter } from "./rsvps";

export const membersRouter = t.router({
  events: memberEventsRouter,
  activityLogs: memberActivityLogsRouter,
  profile: memberProfileRouter,
  bikes: memberBikesRouter,
  settings: memberSettingsRouter,
  notifications: memberNotificationsRouter,
  roster: memberRosterRouter,
  rsvps: memberRsvpRouter,
});
