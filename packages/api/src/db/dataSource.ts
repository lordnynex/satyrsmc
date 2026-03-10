import { DataSource } from "typeorm";
import type { DataSourceOptions } from "typeorm";
import { join } from "path";
import {
  Document,
  DocumentVersion,
  Event,
  EventPhoto,
  EventAttendee,
  EventRideMemberAttendee,
  EventAsset,
  RideScheduleItem,
  EventPlanningMilestone,
  EventMilestoneMember,
  EventPackingCategory,
  EventPackingItem,
  EventVolunteer,
  EventAssignment,
  EventAssignmentMember,
  Budget,
  LineItem,
  Scenario,
  Member,
  Contact,
  ContactEmail,
  ContactPhone,
  ContactAddress,
  ContactNote,
  ContactEmergencyContact,
  ContactPhoto,
  Tag,
  ContactTag,
  MailingList,
  MailingListMember,
  MailingBatch,
  MailingBatchRecipient,
  QrCode,
  Meeting,
  MeetingMotion,
  MeetingActionItem,
  OldBusinessItem,
  MeetingTemplate,
  Committee,
  CommitteeMember,
  CommitteeMeeting,
  SitePage,
  SiteSettings,
  SiteMenuItem,
  BlogPost,
  ContactSubmission,
  ContactMemberSubmission,
  Incident,
} from "../entities";
import { PostgresBaseline1800000000000 } from "./migrations/1800000000000-PostgresBaseline.ts";

export function getProjectRoot(): string {
  return process.env.DATA_DIR ?? join(import.meta.dir, "../../../..");
}

const entities = [
  Event,
  EventPhoto,
  EventAttendee,
  EventRideMemberAttendee,
  EventAsset,
  RideScheduleItem,
  EventPlanningMilestone,
  EventMilestoneMember,
  EventPackingCategory,
  EventPackingItem,
  EventVolunteer,
  EventAssignment,
  EventAssignmentMember,
  Budget,
  LineItem,
  Scenario,
  Member,
  Contact,
  ContactEmail,
  ContactPhone,
  ContactAddress,
  ContactNote,
  ContactEmergencyContact,
  ContactPhoto,
  Tag,
  ContactTag,
  MailingList,
  MailingListMember,
  MailingBatch,
  MailingBatchRecipient,
  QrCode,
  Document,
  DocumentVersion,
  Meeting,
  MeetingMotion,
  MeetingActionItem,
  OldBusinessItem,
  MeetingTemplate,
  Committee,
  CommitteeMember,
  CommitteeMeeting,
  SitePage,
  SiteSettings,
  SiteMenuItem,
  BlogPost,
  ContactSubmission,
  ContactMemberSubmission,
  Incident,
];

export const dataSourceOptions: DataSourceOptions = {
  name: "badger",
  type: "postgres",
  url: process.env.DATABASE_URL,
  synchronize: false,
  migrations: [PostgresBaseline1800000000000],
  migrationsRun: true,
  entities,
};

const globalForDataSource = globalThis as unknown as {
  __badgerDataSource?: DataSource;
  __badgerInitPromise?: Promise<DataSource>;
};

/**
 * Returns the single DataSource instance. Initializes it once; all callers share the same instance.
 * Do not use createConnection or getConnectionManager - this is the only connection.
 */
export async function getDataSource(): Promise<DataSource> {
  if (globalForDataSource.__badgerDataSource?.isInitialized) {
    return globalForDataSource.__badgerDataSource;
  }
  if (!globalForDataSource.__badgerInitPromise) {
    const ds = new DataSource(dataSourceOptions);
    globalForDataSource.__badgerDataSource = ds;
    globalForDataSource.__badgerInitPromise = ds.initialize().then(() => ds);
  }
  return globalForDataSource.__badgerInitPromise;
}
