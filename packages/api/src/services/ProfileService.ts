import type { DataSource } from "typeorm";
import type {
  MemberProfileGetOutput,
  ProfileSettingsGetOutput,
  ProfileSettingsUpdateInput,
  ProfileSettingsUpdateOutput,
  ProfilePhotoUploadOutput,
} from "@satyrsmc/shared/dto/member/profile";
import { User } from "../entities/User";
import { Member } from "../entities/Member";
import { Contact } from "../entities/Contact";
import { ContactPhone } from "../entities/ContactPhone";
import { ContactAddress } from "../entities/ContactAddress";
import { ContactEmergencyContact } from "../entities/ContactEmergencyContact";
import { ContactPhoto } from "../entities/ContactPhoto";
import { Bike } from "../entities/Bike";
import { ContactPhotoType } from "@satyrsmc/shared/lib/enums";
import { ContactEmail } from "../entities/ContactEmail";
import { ImageService } from "./ImageService";
import { toISOStringOrNull } from "../lib/date";
import { uuid, parsePhotoToBlob } from "./utils";
import type { ActivityLogsService } from "./ActivityLogsService";
import { ActivityMessageCode } from "@satyrsmc/shared/lib/enums";
import { formatPhoneNumber } from "@satyrsmc/shared/lib/phone";

export class ProfileService {
  constructor(
    private ds: DataSource,
    private activityLogs: ActivityLogsService,
  ) {}

  async getByUsername(
    username: string,
    viewerUserId: string,
  ): Promise<MemberProfileGetOutput | null> {
    const user = await this.ds
      .getRepository(User)
      .createQueryBuilder("u")
      .where("LOWER(u.username) = LOWER(:username)", { username })
      .getOne();

    if (!user || !user.memberId) return null;

    const member = await this.ds.getRepository(Member).findOne({ where: { id: user.memberId } });
    if (!member) return null;

    const contact = await this.ds.getRepository(Contact).findOne({ where: { id: user.contactId } });
    if (!contact) return null;

    const isOwnProfile = user.id === viewerUserId;

    const [primaryEmail, primaryPhone, address, emergencyContacts, photoExists, bikes] =
      await Promise.all([
        this.ds
          .getRepository(ContactEmail)
          .findOne({ where: { contactId: user.contactId, isPrimary: true } }),
        this.ds
          .getRepository(ContactPhone)
          .findOne({ where: { contactId: user.contactId, isPrimary: true } }),
        this.ds
          .getRepository(ContactAddress)
          .findOne({ where: { contactId: user.contactId, isPrimaryMailing: true } }),
        isOwnProfile
          ? this.ds
              .getRepository(ContactEmergencyContact)
              .find({ where: { contactId: user.contactId } })
          : Promise.resolve([]),
        this.ds
          .getRepository(ContactPhoto)
          .findOne({ where: { contactId: user.contactId, type: ContactPhotoType.Profile } }),
        this.ds
          .getRepository(Bike)
          .find({ where: { userId: user.id }, order: { isPrimary: "DESC", createdAt: "ASC" } }),
      ]);
    const hasPhoto = !!photoExists;

    return {
      id: user.id,
      username: user.username,
      display_name: contact.displayName,
      first_name: contact.firstName,
      last_name: contact.lastName,
      position: member.position,
      member_since: toISOStringOrNull(member.memberSince),
      birthday: toISOStringOrNull(contact.birthday),
      email: primaryEmail?.email ?? null,
      phone: primaryPhone ? formatPhoneNumber(primaryPhone.phone) : null,
      address: address
        ? {
            line1: address.addressLine1,
            line2: address.addressLine2,
            city: address.city,
            state: address.state,
            postal_code: address.postalCode,
          }
        : null,
      emergency_contacts: emergencyContacts.map((ec) => ({
        name: ec.name,
        phone: formatPhoneNumber(ec.phone),
        relationship: ec.relationship,
      })),
      is_own_profile: isOwnProfile,
      has_photo: hasPhoto,
      photo_url: hasPhoto ? `/api/members/${user.memberId}/photo?size=full` : null,
      photo_thumbnail_url: hasPhoto ? `/api/members/${user.memberId}/photo?size=thumbnail` : null,
      bikes: bikes.map((b) => ({
        id: b.id,
        year: b.year,
        make: b.make,
        model: b.model,
        trim: b.trim,
        mods: b.mods,
        has_photo: b.photo !== null && b.photo !== undefined,
        is_primary: b.isPrimary,
      })),
    };
  }

  async getOwnSettings(userId: string): Promise<ProfileSettingsGetOutput> {
    const user = await this.ds.getRepository(User).findOne({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    const contact = await this.ds.getRepository(Contact).findOne({ where: { id: user.contactId } });
    if (!contact) throw new Error("Contact not found");

    const phones = await this.ds
      .getRepository(ContactPhone)
      .find({ where: { contactId: user.contactId } });

    const addresses = await this.ds
      .getRepository(ContactAddress)
      .find({ where: { contactId: user.contactId } });

    const emergencyContacts = await this.ds
      .getRepository(ContactEmergencyContact)
      .find({ where: { contactId: user.contactId } });

    const photoExists = await this.ds
      .getRepository(ContactPhoto)
      .findOne({ where: { contactId: user.contactId, type: ContactPhotoType.Profile } });
    const hasPhoto = !!photoExists;
    const memberId = user.memberId;

    return {
      first_name: contact.firstName,
      last_name: contact.lastName,
      birthday: toISOStringOrNull(contact.birthday),
      has_photo: hasPhoto,
      photo_url: hasPhoto && memberId ? `/api/members/${memberId}/photo?size=full` : null,
      phones: phones.map((p) => ({
        id: p.id,
        phone: p.phone,
        type: p.type,
        is_primary: p.isPrimary,
      })),
      addresses: addresses.map((a) => ({
        id: a.id,
        address_line1: a.addressLine1,
        address_line2: a.addressLine2,
        city: a.city,
        state: a.state,
        postal_code: a.postalCode,
        country: a.country,
        type: a.type,
        is_primary_mailing: a.isPrimaryMailing,
      })),
      emergency_contacts: emergencyContacts.map((ec) => ({
        id: ec.id,
        name: ec.name,
        phone: ec.phone,
        email: ec.email,
        relationship: ec.relationship,
      })),
    };
  }

  async updateOwnSettings(
    userId: string,
    input: ProfileSettingsUpdateInput,
  ): Promise<ProfileSettingsUpdateOutput> {
    const user = await this.ds.getRepository(User).findOne({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    const contactId = user.contactId;

    // Update contact name
    const displayName = [input.first_name, input.last_name].filter(Boolean).join(" ");
    await this.ds.getRepository(Contact).update(contactId, {
      firstName: input.first_name,
      lastName: input.last_name,
      displayName,
      updatedAt: new Date(),
    });

    // Update phones
    if (input.phones !== undefined) {
      const phoneRepo = this.ds.getRepository(ContactPhone);
      await phoneRepo.delete({ contactId });
      // If none marked primary, auto-promote the first one
      const hasPrimary = input.phones.some((p) => p.is_primary);
      for (let i = 0; i < input.phones.length; i++) {
        const phone = input.phones[i];
        await phoneRepo.save(
          phoneRepo.create({
            id: phone.id ?? uuid(),
            contactId,
            phone: phone.phone.replace(/\D/g, ""),
            type: phone.type as never,
            isPrimary: phone.is_primary || (!hasPrimary && i === 0),
          }),
        );
      }
    }

    // Update addresses
    if (input.addresses !== undefined) {
      const addrRepo = this.ds.getRepository(ContactAddress);
      await addrRepo.delete({ contactId });
      // If none marked primary mailing, auto-promote the first one
      const hasPrimaryMailing = input.addresses.some((a) => a.is_primary_mailing);
      for (let i = 0; i < input.addresses.length; i++) {
        const addr = input.addresses[i];
        await addrRepo.save(
          addrRepo.create({
            id: addr.id ?? uuid(),
            contactId,
            addressLine1: addr.address_line1 ?? null,
            addressLine2: addr.address_line2 ?? null,
            city: addr.city ?? null,
            state: addr.state ?? null,
            postalCode: addr.postal_code ?? null,
            country: addr.country ?? "US",
            type: addr.type as never,
            isPrimaryMailing: addr.is_primary_mailing || (!hasPrimaryMailing && i === 0),
          }),
        );
      }
    }

    // Update emergency contacts
    if (input.emergency_contacts !== undefined) {
      const ecRepo = this.ds.getRepository(ContactEmergencyContact);
      await ecRepo.delete({ contactId });
      for (const ec of input.emergency_contacts) {
        await ecRepo.save(
          ecRepo.create({
            id: ec.id ?? uuid(),
            contactId,
            name: ec.name,
            phone: ec.phone.replace(/\D/g, ""),
            email: ec.email ?? null,
            relationship: ec.relationship ?? null,
          }),
        );
      }
    }

    return { success: true };
  }

  async uploadPhoto(userId: string, base64Photo: string): Promise<ProfilePhotoUploadOutput> {
    const user = await this.ds.getRepository(User).findOne({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    const photoBlob = parsePhotoToBlob(base64Photo);
    if (!photoBlob) throw new Error("Invalid photo data");

    const optimized = await ImageService.optimize(photoBlob);
    const thumbnail = await ImageService.createThumbnail(photoBlob);

    const photoRepo = this.ds.getRepository(ContactPhoto);

    // Remove existing profile photo
    await photoRepo.delete({
      contactId: user.contactId,
      type: ContactPhotoType.Profile,
    });

    // Insert new photo
    await photoRepo.save(
      photoRepo.create({
        id: uuid(),
        contactId: user.contactId,
        type: ContactPhotoType.Profile,
        sortOrder: 0,
        photo: optimized,
        photoThumbnail: thumbnail,
        createdAt: new Date(),
      }),
    );

    // Log activity
    await this.activityLogs.create({
      user_id: userId,
      message_code: ActivityMessageCode.ProfilePhotoSubmitted,
    });

    return { success: true };
  }
}
