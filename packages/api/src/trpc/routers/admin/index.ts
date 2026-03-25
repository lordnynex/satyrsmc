import { t } from "../../trpc";
import { eventsRouter } from "./events";
import { budgetsRouter } from "./budgets";
import { membersRouter } from "./members";
import { scenariosRouter } from "./scenarios";
import { contactsRouter } from "./contacts";
import { mailingListsRouter } from "./mailingLists";
import { mailingBatchesRouter } from "./mailingBatches";
import { qrCodesRouter } from "./qrCodes";
import { meetingsRouter } from "./meetings";
import { incidentsRouter } from "./incidents";
import { meetingTemplatesRouter } from "./meetingTemplates";
import { documentsRouter } from "./documents";
import { committeesRouter } from "./committees";
import { websiteAdminRouter } from "./websiteAdmin";
import { usersRouter } from "./users";
import { activityLogsRouter } from "./activityLogs";
import { membershipLogsRouter } from "./membershipLogs";
import { adminRsvpRouter } from "./rsvps";
import { adminInvitationRouter } from "./invitations";

export const adminRouter = t.router({
  events: eventsRouter,
  budgets: budgetsRouter,
  members: membersRouter,
  scenarios: scenariosRouter,
  contacts: contactsRouter,
  mailingLists: mailingListsRouter,
  mailingBatches: mailingBatchesRouter,
  qrCodes: qrCodesRouter,
  meetings: meetingsRouter,
  meetingTemplates: meetingTemplatesRouter,
  documents: documentsRouter,
  committees: committeesRouter,
  website: websiteAdminRouter,
  incidents: incidentsRouter,
  users: usersRouter,
  activityLogs: activityLogsRouter,
  membershipLogs: membershipLogsRouter,
  rsvps: adminRsvpRouter,
  invitations: adminInvitationRouter,
});
