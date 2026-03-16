import { DataSource } from "typeorm";
import type { DataSourceOptions } from "typeorm";
import { join } from "path";
import {
  Document,
  DocumentVersion,
  Event,
  EventPhoto,
  EventAttendee,
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
  User,
  Registration,
  ActivityLog,
  MembershipLog,
} from "../entities";
import { PostgresBaseline1800000000000 } from "./migrations/1800000000000-PostgresBaseline.ts";
import { ConvertTextToEnumTypes1800000001000 } from "./migrations/1800000001000-ConvertTextToEnumTypes.ts";
import { AddContactIdToMembers1800000002000 } from "./migrations/1800000002000-AddContactIdToMembers.ts";
import { CreateUsersAndRegistrations1800000003000 } from "./migrations/1800000003000-CreateUsersAndRegistrations.ts";
import { MigrateMemberDataToContacts1800000004000 } from "./migrations/1800000004000-MigrateMemberDataToContacts.ts";
import { DropRedundantMemberColumns1800000005000 } from "./migrations/1800000005000-DropRedundantMemberColumns.ts";
import { AddEventRsvps1800000006000 } from "./migrations/1800000006000-AddEventRsvps.ts";
import { NormalizeEventDatesToNoonUtc1800000007000 } from "./migrations/1800000007000-NormalizeEventDatesToNoonUtc.ts";
import { ConsolidateAttendees1800000008000 } from "./migrations/1800000008000-ConsolidateAttendees.ts";
import { RenameStatusToRsvpStatus1800000009000 } from "./migrations/1800000009000-RenameStatusToRsvpStatus.ts";
import { EventDateAndHostChanges1800000010000 } from "./migrations/1800000010000-EventDateAndHostChanges.ts";
import { CreateLogTables1800000011000 } from "./migrations/1800000011000-CreateLogTables.ts";

export function getProjectRoot(): string {
  return process.env.DATA_DIR ?? join(import.meta.dir, "../../../..");
}

const entities = [
  Event,
  EventPhoto,
  EventAttendee,
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
  User,
  Registration,
  ActivityLog,
  MembershipLog,
];

export const dataSourceOptions: DataSourceOptions = {
  name: "badger",
  type: "postgres",
  url: process.env.DATABASE_URL,
  synchronize: false,
  migrations: [
    PostgresBaseline1800000000000,
    ConvertTextToEnumTypes1800000001000,
    AddContactIdToMembers1800000002000,
    CreateUsersAndRegistrations1800000003000,
    MigrateMemberDataToContacts1800000004000,
    DropRedundantMemberColumns1800000005000,
    AddEventRsvps1800000006000,
    NormalizeEventDatesToNoonUtc1800000007000,
    ConsolidateAttendees1800000008000,
    RenameStatusToRsvpStatus1800000009000,
    EventDateAndHostChanges1800000010000,
    CreateLogTables1800000011000,
  ],
  migrationsRun: true,
  entities,
};

const globalForDataSource = globalThis as unknown as {
  __badgerDataSource?: DataSource;
  __badgerInitPromise?: Promise<DataSource>;
};

async function getEffectiveOptions(): Promise<DataSourceOptions> {
  if (process.env.USE_PGLITE !== "1") {
    return dataSourceOptions;
  }
  // In-memory PGlite for local dev (no DATABASE_URL required)
  const { PGliteDriver } = await import("typeorm-pglite");
  return {
    ...dataSourceOptions,
    url: undefined,
    driver: new PGliteDriver().driver,
  } as DataSourceOptions;
}

/**
 * Returns the single DataSource instance. Initializes it once; all callers share the same instance.
 * Do not use createConnection or getConnectionManager - this is the only connection.
 * When USE_PGLITE=1, uses in-memory PGlite instead of DATABASE_URL.
 */
export async function getDataSource(): Promise<DataSource> {
  if (globalForDataSource.__badgerDataSource?.isInitialized) {
    return globalForDataSource.__badgerDataSource;
  }
  if (!globalForDataSource.__badgerInitPromise) {
    const options = await getEffectiveOptions();
    const ds = new DataSource(options);
    globalForDataSource.__badgerDataSource = ds;
    globalForDataSource.__badgerInitPromise = ds.initialize().then(() => ds);
  }
  return globalForDataSource.__badgerInitPromise;
}
