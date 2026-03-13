import type { DataSource } from "typeorm";
import type { DbLike } from "../db/dbAdapter";
import { EventsService } from "./EventsService";
import { BudgetsService } from "./BudgetsService";
import { MembersService } from "./MembersService";
import { ScenariosService } from "./ScenariosService";
import { ContactsService } from "./ContactsService";
import { MailingListsService } from "./MailingListsService";
import { MailingBatchesService } from "./MailingBatchesService";
import { QrCodesService } from "./QrCodesService";
import { MeetingsService } from "./MeetingsService";
import { MeetingTemplatesService } from "./MeetingTemplatesService";
import { DocumentsService } from "./DocumentsService";
import { CommitteesService } from "./CommitteesService";
import { SitePagesService } from "./SitePagesService";
import { SiteSettingsService } from "./SiteSettingsService";
import { SiteMenusService } from "./SiteMenusService";
import { BlogService } from "./BlogService";
import { ContactSubmissionsService } from "./ContactSubmissionsService";
import { AuthService } from "./AuthService";
import { UsersService } from "./UsersService";
import { ConsoleEmailService } from "./EmailService";
import type { EmailService } from "./EmailService";

export function createApi(db: DbLike, ds: DataSource, emailService?: EmailService) {
  const email = emailService ?? new ConsoleEmailService();
  const eventsService = new EventsService(db, ds);
  const budgetsService = new BudgetsService(db, ds);
  const membersService = new MembersService(db, ds);
  const scenariosService = new ScenariosService(db, ds);
  const contactsService = new ContactsService(db, ds);
  const mailingListsService = new MailingListsService(db, ds, contactsService);
  const mailingBatchesService = new MailingBatchesService(db, ds, mailingListsService);
  const qrCodesService = new QrCodesService(ds);
  const meetingsService = new MeetingsService(ds);
  const meetingTemplatesService = new MeetingTemplatesService(ds);
  const documentsService = new DocumentsService(ds);
  const committeesService = new CommitteesService(ds);

  return {
    events: eventsService,
    budgets: budgetsService,
    members: membersService,
    scenarios: scenariosService,
    contacts: contactsService,
    mailingLists: mailingListsService,
    mailingBatches: mailingBatchesService,
    qrCodes: qrCodesService,
    meetings: meetingsService,
    meetingTemplates: meetingTemplatesService,
    documents: documentsService,
    committees: committeesService,
    sitePages: new SitePagesService(ds),
    siteSettings: new SiteSettingsService(ds),
    siteMenus: new SiteMenusService(ds),
    blog: new BlogService(ds),
    contactSubmissions: new ContactSubmissionsService(ds),
    auth: new AuthService(ds, email),
    users: new UsersService(ds, email),
  };
}

export type Api = ReturnType<typeof createApi>;
