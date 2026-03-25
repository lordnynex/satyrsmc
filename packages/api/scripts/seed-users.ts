#!/usr/bin/env bun
/**
 * Seed script — creates sample users, mailing lists, and events for manual testing.
 *
 * Usage:
 *   bun run seed                           # Uses DATABASE_URL from packages/api/.env
 *                                          # Set USE_PGLITE=1 in .env for in-memory PGlite
 *
 * Creates these accounts (all passwords: "Password1!"):
 *
 *   | Username    | Type      | Status    | Member? | Notes                    |
 *   |-------------|-----------|-----------|---------|--------------------------|
 *   | admin       | admin     | active    | yes     | Full admin access        |
 *   | webmaster   | webmaster | active    | yes     | Webmaster access         |
 *   | member      | user      | active    | yes     | Active member user       |
 *   | user        | user      | active    | no      | Regular user (no member) |
 *   | locked      | user      | locked    | no      | Locked (pending approval)|
 *   | suspended   | user      | suspended | no      | Suspended account        |
 *
 * Also creates:
 *   - 3 mailing lists (all member users subscribed)
 *   - 4 sample events (mix of upcoming and past)
 *
 * The script is idempotent — it skips records that already exist.
 */
import "reflect-metadata";
import { DataSource, type DataSourceOptions } from "typeorm";
import { hash } from "bcryptjs";
import { dataSourceOptions } from "../src/db/dataSource";
import { User } from "../src/entities/User";
import { Contact } from "../src/entities/Contact";
import { ContactEmail } from "../src/entities/ContactEmail";
import { ContactPhone } from "../src/entities/ContactPhone";
import { ContactAddress } from "../src/entities/ContactAddress";
import { Member } from "../src/entities/Member";
import { Event } from "../src/entities/Event";
import { MailingList } from "../src/entities/MailingList";
import { MailingListMember } from "../src/entities/MailingListMember";
import { WaiverVersion } from "../src/entities/WaiverVersion";
import { RsvpSubmission } from "../src/entities/RsvpSubmission";
import { BadgerRegistration } from "../src/entities/BadgerRegistration";
import { EventAttendee } from "../src/entities/EventAttendee";
import {
  UserType,
  UserStatus,
  ContactType,
  ContactStatus,
  ContactEmailType,
  ContactPhoneType,
  ContactAddressType,
  EventType,
  MailingListType,
  MailingDeliveryType,
  MailingMemberSource,
  AttendeeStatus,
  RegistrationMethod,
  PaymentStatus,
  PaymentMethod,
  TshirtSize,
  TravelMode,
} from "@satyrsmc/shared/lib/enums";
import { logger } from "../src/logger";

const SEED_PASSWORD = "Password1!";
const BCRYPT_COST = 12;
const BADGER_GA_TICKET_COST = 75;

const WAIVER_BODY = `RELEASE AND WAIVER OF LIABILITY

In consideration of being permitted to participate in any and all activities of Satyrs Motorcycle Club ("the Club"), I, the undersigned, acknowledge, appreciate, and agree that:

1. The risk of injury from the activities involved in this program is significant, including the potential for permanent paralysis and death, and while particular rules, equipment, and personal discipline may reduce this risk, the risk of serious injury does exist.

2. I KNOWINGLY AND FREELY ASSUME ALL SUCH RISKS, both known and unknown, EVEN IF ARISING FROM THE NEGLIGENCE OF THE RELEASEES or others, and assume full responsibility for my participation.

3. I willingly agree to comply with the stated and customary terms and conditions for participation. If, however, I observe any unusual significant hazard during my presence or participation, I will remove myself from participation and bring such to the attention of the nearest official immediately.

4. I, for myself and on behalf of my heirs, assigns, personal representatives and next of kin, HEREBY RELEASE AND HOLD HARMLESS Satyrs Motorcycle Club, its officers, officials, agents, and/or employees, other participants, sponsoring agencies, sponsors, advertisers, and, if applicable, owners and lessors of premises used to conduct the event ("RELEASEES"), WITH RESPECT TO ANY AND ALL INJURY, DISABILITY, DEATH, or loss or damage to person or property, WHETHER ARISING FROM THE NEGLIGENCE OF THE RELEASEES OR OTHERWISE, to the fullest extent permitted by law.

I HAVE READ THIS RELEASE OF LIABILITY AND ASSUMPTION OF RISK AGREEMENT, FULLY UNDERSTAND ITS TERMS, UNDERSTAND THAT I HAVE GIVEN UP SUBSTANTIAL RIGHTS BY SIGNING IT, AND SIGN IT FREELY AND VOLUNTARILY WITHOUT ANY INDUCEMENT.`;

async function hashToken(raw: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(raw);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function contentHash(text: string): Promise<string> {
  return hashToken(text);
}

interface SeedUser {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: UserType;
  userStatus: UserStatus;
  createMember: boolean;
}

const SEED_USERS: SeedUser[] = [
  {
    username: "admin",
    email: "admin@satyrsmc.org",
    firstName: "Admin",
    lastName: "User",
    userType: UserType.Admin,
    userStatus: UserStatus.Active,
    createMember: true,
  },
  {
    username: "webmaster",
    email: "webmaster@satyrsmc.org",
    firstName: "Web",
    lastName: "Master",
    userType: UserType.Webmaster,
    userStatus: UserStatus.Active,
    createMember: true,
  },
  {
    username: "member",
    email: "member@satyrsmc.org",
    firstName: "Member",
    lastName: "User",
    userType: UserType.User,
    userStatus: UserStatus.Active,
    createMember: true,
  },
  {
    username: "user",
    email: "user@satyrsmc.org",
    firstName: "Regular",
    lastName: "User",
    userType: UserType.User,
    userStatus: UserStatus.Active,
    createMember: false,
  },
  {
    username: "locked",
    email: "locked@satyrsmc.org",
    firstName: "Locked",
    lastName: "User",
    userType: UserType.User,
    userStatus: UserStatus.Locked,
    createMember: false,
  },
  {
    username: "suspended",
    email: "suspended@satyrsmc.org",
    firstName: "Suspended",
    lastName: "User",
    userType: UserType.User,
    userStatus: UserStatus.Suspended,
    createMember: false,
  },
];

interface SeedMailingList {
  name: string;
  description: string;
  listType: MailingListType;
  deliveryType: MailingDeliveryType;
}

const SEED_MAILING_LISTS: SeedMailingList[] = [
  {
    name: "Club Newsletter",
    description: "Monthly club newsletter with updates, photos, and upcoming events.",
    listType: MailingListType.Static,
    deliveryType: MailingDeliveryType.Email,
  },
  {
    name: "Run Announcements",
    description: "Ride and run announcements, route details, and logistics.",
    listType: MailingListType.Static,
    deliveryType: MailingDeliveryType.Email,
  },
  {
    name: "Holiday Greeting Cards",
    description: "Annual holiday card mailing to all members and friends of the club.",
    listType: MailingListType.Static,
    deliveryType: MailingDeliveryType.Physical,
  },
];

interface SeedEvent {
  name: string;
  description: string;
  eventType: EventType;
  startDate: Date;
  endDate: Date | null;
  eventLocation: string | null;
  showOnWebsite: boolean;
  membersOnly: boolean;
  year: number;
}

function makeSeedEvents(): SeedEvent[] {
  const now = new Date();
  const currentYear = now.getFullYear();

  return [
    {
      name: `Badger Run ${currentYear}`,
      description:
        "Annual Badger Run — our flagship event! Three days of riding through the mountains with camping, live music, and brotherhood.",
      eventType: EventType.Badger,
      startDate: new Date(Date.UTC(currentYear, 6, 18, 12, 0, 0)), // Jul 18
      endDate: new Date(Date.UTC(currentYear, 6, 20, 12, 0, 0)), // Jul 20
      eventLocation: "Lake Cachuma, Santa Barbara County, CA",
      showOnWebsite: true,
      membersOnly: false,
      year: currentYear,
    },
    {
      name: "Spring Canyon Ride",
      description:
        "Day ride through the canyons north of LA. Meet at Denny's in Simi Valley at 9 AM. Route is approximately 120 miles.",
      eventType: EventType.Rides,
      startDate: new Date(Date.UTC(currentYear, 3, 12, 16, 0, 0)), // Apr 12
      endDate: null,
      eventLocation: "Denny's, Simi Valley, CA",
      showOnWebsite: true,
      membersOnly: false,
      year: currentYear,
    },
    {
      name: `Pioneer Run ${currentYear}`,
      description:
        "Annual Pioneer Run honoring the founding members of the club. Open to all members and invited guests.",
      eventType: EventType.PioneerRun,
      startDate: new Date(Date.UTC(currentYear, 9, 4, 12, 0, 0)), // Oct 4
      endDate: new Date(Date.UTC(currentYear, 9, 5, 12, 0, 0)), // Oct 5
      eventLocation: "Kern River, Kernville, CA",
      showOnWebsite: true,
      membersOnly: true,
      year: currentYear,
    },
    {
      name: `Anniversary Party ${currentYear - 1}`,
      description:
        "Celebration of the club's founding. Dinner, awards, and recognition of long-standing members.",
      eventType: EventType.Anniversary,
      startDate: new Date(Date.UTC(currentYear - 1, 10, 15, 18, 0, 0)), // Nov 15 last year
      endDate: null,
      eventLocation: "Elks Lodge, Pasadena, CA",
      showOnWebsite: false,
      membersOnly: true,
      year: currentYear - 1,
    },
  ];
}

async function getSeederDataSource(): Promise<DataSource> {
  const opts = { ...dataSourceOptions, migrationsRun: true };

  if (process.env.USE_PGLITE === "1") {
    const { PGliteDriver } = await import("typeorm-pglite");
    const ds = new DataSource({
      ...opts,
      url: undefined,
      driver: new PGliteDriver().driver,
    } as DataSourceOptions);
    return ds;
  }

  return new DataSource(opts);
}

async function main() {
  logger.info("Seeding sample data...");

  const ds = await getSeederDataSource();
  await ds.initialize();

  const passwordHash = await hash(SEED_PASSWORD, BCRYPT_COST);

  const userRepo = ds.getRepository(User);
  const contactRepo = ds.getRepository(Contact);
  const emailRepo = ds.getRepository(ContactEmail);
  const phoneRepo = ds.getRepository(ContactPhone);
  const addressRepo = ds.getRepository(ContactAddress);
  const memberRepo = ds.getRepository(Member);
  const eventRepo = ds.getRepository(Event);
  const mailingListRepo = ds.getRepository(MailingList);
  const mailingListMemberRepo = ds.getRepository(MailingListMember);

  // ── Users ──────────────────────────────────────────────────────────────────

  let usersCreated = 0;
  let usersSkipped = 0;
  /** Contact IDs of users who are members (for mailing list enrollment) */
  const memberContactIds: string[] = [];

  for (const seed of SEED_USERS) {
    const existing = await userRepo
      .createQueryBuilder("u")
      .where("LOWER(u.username) = LOWER(:username)", { username: seed.username })
      .getOne();

    if (existing) {
      logger.info(`  skip user: ${seed.username} (already exists)`);
      usersSkipped++;
      // Still collect contactId for mailing list enrollment
      if (seed.createMember && existing.contactId) {
        memberContactIds.push(existing.contactId);
      }
      continue;
    }

    // Create contact
    const contact = contactRepo.create({
      id: crypto.randomUUID(),
      type: ContactType.Person,
      status: ContactStatus.Active,
      displayName: `${seed.firstName} ${seed.lastName}`,
      firstName: seed.firstName,
      lastName: seed.lastName,
    });
    await contactRepo.save(contact);

    // Create contact email
    const contactEmail = emailRepo.create({
      id: crypto.randomUUID(),
      contactId: contact.id,
      email: seed.email,
      type: ContactEmailType.Home,
      isPrimary: true,
    });
    await emailRepo.save(contactEmail);

    // Create contact phone
    await phoneRepo.save(
      phoneRepo.create({
        id: crypto.randomUUID(),
        contactId: contact.id,
        phone: "5551234567",
        type: ContactPhoneType.Cell,
        isPrimary: true,
      }),
    );

    // Create contact address
    await addressRepo.save(
      addressRepo.create({
        id: crypto.randomUUID(),
        contactId: contact.id,
        addressLine1: "123 Main St",
        city: "Los Angeles",
        state: "CA",
        postalCode: "90001",
        country: "US",
        type: ContactAddressType.Home,
        isPrimaryMailing: true,
      }),
    );

    // Optionally create member
    let memberId: string | null = null;
    if (seed.createMember) {
      const member = memberRepo.create({
        id: crypto.randomUUID(),
        contactId: contact.id,
      });
      await memberRepo.save(member);
      memberId = member.id;
      memberContactIds.push(contact.id);
    }

    // Create user
    const user = userRepo.create({
      id: crypto.randomUUID(),
      contactId: contact.id,
      memberId,
      username: seed.username,
      passwordHash,
      userType: seed.userType,
      userStatus: seed.userStatus,
    });
    await userRepo.save(user);

    logger.info(
      `  created user: ${seed.username} (${seed.userType}, ${seed.userStatus}${memberId ? ", member" : ""})`,
    );
    usersCreated++;
  }

  logger.info(`Users: ${usersCreated} created, ${usersSkipped} skipped`);

  // ── Mailing Lists ─────────────────────────────────────────────────────────

  let listsCreated = 0;
  let listsSkipped = 0;
  const createdListIds: string[] = [];

  for (const seed of SEED_MAILING_LISTS) {
    const existing = await mailingListRepo
      .createQueryBuilder("ml")
      .where("LOWER(ml.name) = LOWER(:name)", { name: seed.name })
      .getOne();

    if (existing) {
      logger.info(`  skip mailing list: ${seed.name} (already exists)`);
      listsSkipped++;
      createdListIds.push(existing.id);
      continue;
    }

    const list = mailingListRepo.create({
      id: crypto.randomUUID(),
      name: seed.name,
      description: seed.description,
      listType: seed.listType,
      deliveryType: seed.deliveryType,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await mailingListRepo.save(list);
    createdListIds.push(list.id);

    logger.info(`  created mailing list: ${seed.name} (${seed.listType}, ${seed.deliveryType})`);
    listsCreated++;
  }

  // Enroll all member contacts in every mailing list
  let enrollments = 0;
  for (const listId of createdListIds) {
    for (const contactId of memberContactIds) {
      const existing = await mailingListMemberRepo.findOne({
        where: { listId, contactId },
      });
      if (existing) continue;

      const mlm = mailingListMemberRepo.create({
        id: crypto.randomUUID(),
        listId,
        contactId,
        source: MailingMemberSource.Manual,
        suppressed: false,
        unsubscribed: false,
        addedAt: new Date(),
      });
      await mailingListMemberRepo.save(mlm);
      enrollments++;
    }
  }

  logger.info(
    `Mailing lists: ${listsCreated} created, ${listsSkipped} skipped, ${enrollments} enrollments`,
  );

  // ── Events ────────────────────────────────────────────────────────────────

  let eventsCreated = 0;
  let eventsSkipped = 0;

  for (const seed of makeSeedEvents()) {
    const existing = await eventRepo
      .createQueryBuilder("e")
      .where("LOWER(e.name) = LOWER(:name)", { name: seed.name })
      .getOne();

    if (existing) {
      logger.info(`  skip event: ${seed.name} (already exists)`);
      eventsSkipped++;
      continue;
    }

    const event = eventRepo.create({
      id: crypto.randomUUID(),
      name: seed.name,
      description: seed.description,
      eventType: seed.eventType,
      startDate: seed.startDate,
      endDate: seed.endDate,
      eventLocation: seed.eventLocation,
      showOnWebsite: seed.showOnWebsite,
      membersOnly: seed.membersOnly,
      year: seed.year,
      createdAt: new Date(),
      hostIds: [],
    });
    await eventRepo.save(event);

    logger.info(`  created event: ${seed.name} (${seed.eventType})`);
    eventsCreated++;
  }

  logger.info(`Events: ${eventsCreated} created, ${eventsSkipped} skipped`);

  // ── Waiver Version ──────────────────────────────────────────────────────

  const waiverRepo = ds.getRepository(WaiverVersion);
  const existingWaiver = await waiverRepo
    .createQueryBuilder("w")
    .where("w.retired_at IS NULL")
    .getOne();

  if (existingWaiver) {
    logger.info(`  skip waiver: active waiver already exists (v${existingWaiver.version})`);
  } else {
    const hash = await contentHash(WAIVER_BODY);
    const waiver = waiverRepo.create({
      id: crypto.randomUUID(),
      title: "General Liability Waiver",
      body: WAIVER_BODY,
      version: 1,
      contentHash: hash,
      effectiveAt: new Date(),
      retiredAt: null,
      createdAt: new Date(),
    });
    await waiverRepo.save(waiver);
    logger.info("  created waiver: General Liability Waiver (v1)");
  }

  // ── Badger Event: set gaTicketCost ─────────────────────────────────────

  const currentYear = new Date().getFullYear();
  const badgerEvent = await eventRepo
    .createQueryBuilder("e")
    .where("LOWER(e.name) LIKE :name", { name: `%badger%${currentYear}%` })
    .getOne();

  if (badgerEvent) {
    if (badgerEvent.gaTicketCost != null && badgerEvent.gaTicketCost > 0) {
      logger.info(`  skip badger ticket cost: already set ($${badgerEvent.gaTicketCost})`);
    } else {
      await eventRepo.update(badgerEvent.id, {
        gaTicketCost: BADGER_GA_TICKET_COST,
      });
      logger.info(`  updated badger ticket cost: $${BADGER_GA_TICKET_COST}`);
    }
  } else {
    logger.info("  skip badger ticket cost: no Badger event found for current year");
  }

  // ── Sample RSVPs & Attendees for Badger ─────────────────────────────────

  if (badgerEvent) {
    const attendeeRepo = ds.getRepository(EventAttendee);
    const submissionRepo = ds.getRepository(RsvpSubmission);
    const badgerRegRepo = ds.getRepository(BadgerRegistration);

    const existingAttendees = await attendeeRepo
      .createQueryBuilder("a")
      .where("a.event_id = :eventId", { eventId: badgerEvent.id })
      .getCount();

    if (existingAttendees > 0) {
      logger.info(`  skip badger registrations: ${existingAttendees} already exist`);
    } else {
      const waiverHash = await contentHash(WAIVER_BODY);
      const now = new Date();

      const sampleRegistrants = [
        {
          firstName: "Jake",
          lastName: "Rider",
          email: "jake.rider@example.com",
          phone: "5559871234",
          address: "456 Oak Ave",
          zip: "90210",
          emergencyName: "Sarah Rider",
          emergencyPhone: "5559871235",
          tshirtSize: TshirtSize.L,
          travelMode: TravelMode.Motorcycle,
          club: "Desert Eagles MC",
          paymentMethod: PaymentMethod.Zelle,
          status: AttendeeStatus.Pending,
          paymentStatus: PaymentStatus.Pending,
        },
        {
          firstName: "Sam",
          lastName: "Wheeler",
          email: "sam.wheeler@example.com",
          phone: "5551112222",
          address: "789 Pine St",
          zip: "90028",
          emergencyName: "Pat Wheeler",
          emergencyPhone: "5551112223",
          tshirtSize: TshirtSize.XL,
          travelMode: TravelMode.CarTruck,
          club: null,
          paymentMethod: PaymentMethod.Check,
          status: AttendeeStatus.Yes,
          paymentStatus: PaymentStatus.Pending,
        },
        {
          firstName: "Alex",
          lastName: "Gears",
          email: "alex.gears@example.com",
          phone: "5553334444",
          address: "321 Elm Blvd",
          zip: "91001",
          emergencyName: "Morgan Gears",
          emergencyPhone: "5553334445",
          tshirtSize: TshirtSize.M,
          travelMode: TravelMode.Motorcycle,
          club: "Canyon Cruisers",
          paymentMethod: PaymentMethod.Cash,
          status: AttendeeStatus.Yes,
          paymentStatus: PaymentStatus.Confirmed,
        },
      ];

      for (const reg of sampleRegistrants) {
        const attendeeId = crypto.randomUUID();
        const submissionId = crypto.randomUUID();
        const badgerRegId = crypto.randomUUID();

        await attendeeRepo.save(
          attendeeRepo.create({
            id: attendeeId,
            contactId: null,
            userId: null,
            eventId: badgerEvent.id,
            registrationMethod: RegistrationMethod.EventToken,
            invitationId: null,
            status: reg.status,
            sortOrder: 0,
            waiverSigned: true,
            waiverContentHash: waiverHash,
            waiverAcceptedAt: now,
            waiverIp: "127.0.0.1",
            waiverUserAgent: "SeedScript/1.0",
            paymentMethod: reg.paymentMethod,
            paymentStatus: reg.paymentStatus,
            paymentAmountCents: BADGER_GA_TICKET_COST * 100,
            paymentConfirmedByUserId: null,
            paymentConfirmedAt: reg.paymentStatus === PaymentStatus.Confirmed ? now : null,
            externalPaymentId: null,
            externalRefundId: null,
            cancelledAt: null,
            reviewedByUserId: null,
            reviewedAt: null,
            createdAt: now,
            updatedAt: now,
          }),
        );

        await submissionRepo.save(
          submissionRepo.create({
            id: submissionId,
            rsvpId: attendeeId,
            firstName: reg.firstName,
            lastName: reg.lastName,
            email: reg.email,
            phone: reg.phone,
            address: reg.address,
            zip: reg.zip,
            emergencyContactName: reg.emergencyName,
            emergencyContactPhone: reg.emergencyPhone,
            createdAt: now,
          }),
        );

        await badgerRegRepo.save(
          badgerRegRepo.create({
            id: badgerRegId,
            rsvpId: attendeeId,
            tshirtSize: reg.tshirtSize,
            travelingBy: reg.travelMode,
            club: reg.club,
            createdAt: now,
          }),
        );

        logger.info(
          `  created registration: ${reg.firstName} ${reg.lastName} (${reg.status}, payment: ${reg.paymentStatus})`,
        );
      }

      // Add member attendees for the Badger event (simple RSVP, no registration)
      if (memberContactIds.length > 0) {
        const attendeesToAdd = memberContactIds.slice(0, 3);
        for (let i = 0; i < attendeesToAdd.length; i++) {
          const contactId = attendeesToAdd[i]!;
          await attendeeRepo.save(
            attendeeRepo.create({
              id: crypto.randomUUID(),
              eventId: badgerEvent.id,
              contactId,
              sortOrder: i,
              waiverSigned: i < 2,
              status: AttendeeStatus.Yes,
              createdAt: now,
              updatedAt: now,
            }),
          );
        }
        logger.info(`  created ${attendeesToAdd.length} Badger attendees from seed members`);
      }
    }
  }

  // ── Done ──────────────────────────────────────────────────────────────────

  await ds.destroy();
  logger.info("Seed complete.");
  process.exit(0);
}

main().catch((err) => {
  logger.error({ err }, "Seed failed");
  process.exit(1);
});
