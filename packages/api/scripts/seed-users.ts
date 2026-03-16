#!/usr/bin/env bun
/**
 * Seed script — creates sample users for manual testing.
 *
 * Usage:
 *   bun run seed                           # Requires DATABASE_URL
 *   USE_PGLITE=1 bun run seed              # In-memory PGlite (lost on restart)
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
 * The script is idempotent — it skips users whose username already exists.
 */
import "reflect-metadata";
import { DataSource } from "typeorm";
import { hash } from "bcryptjs";
import { dataSourceOptions } from "../src/db/dataSource";
import { User } from "../src/entities/User";
import { Contact } from "../src/entities/Contact";
import { ContactEmail } from "../src/entities/ContactEmail";
import { Member } from "../src/entities/Member";
import {
  UserType,
  UserStatus,
  ContactType,
  ContactStatus,
  ContactEmailType,
} from "@satyrsmc/shared/lib/enums";
import { logger } from "../src/logger";

const SEED_PASSWORD = "Password1!";
const BCRYPT_COST = 12;

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

async function main() {
  logger.info("Seeding sample users...");

  const ds = new DataSource({
    ...dataSourceOptions,
    migrationsRun: true,
  });
  await ds.initialize();

  const passwordHash = await hash(SEED_PASSWORD, BCRYPT_COST);

  const userRepo = ds.getRepository(User);
  const contactRepo = ds.getRepository(Contact);
  const emailRepo = ds.getRepository(ContactEmail);
  const memberRepo = ds.getRepository(Member);

  let created = 0;
  let skipped = 0;

  for (const seed of SEED_USERS) {
    const existing = await userRepo
      .createQueryBuilder("u")
      .where("LOWER(u.username) = LOWER(:username)", { username: seed.username })
      .getOne();

    if (existing) {
      logger.info(`  skip: ${seed.username} (already exists)`);
      skipped++;
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

    // Optionally create member
    let memberId: string | null = null;
    if (seed.createMember) {
      const member = memberRepo.create({
        id: crypto.randomUUID(),
        contactId: contact.id,
      });
      await memberRepo.save(member);
      memberId = member.id;
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
      `  created: ${seed.username} (${seed.userType}, ${seed.userStatus}${memberId ? ", member" : ""})`,
    );
    created++;
  }

  await ds.destroy();
  logger.info(`Seed complete: ${created} created, ${skipped} skipped`);
  process.exit(0);
}

main().catch((err) => {
  logger.error({ err }, "Seed failed");
  process.exit(1);
});
