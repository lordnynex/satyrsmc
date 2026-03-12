import { Entity, PrimaryColumn, Column } from "typeorm";
import { ContactPhotoType } from "@satyrsmc/shared/lib/enums";

@Entity("contact_photos")
export class ContactPhoto {
  @PrimaryColumn("text")
  id!: string;

  @Column({ name: "contact_id", type: "text" })
  contactId!: string;

  /** profile = main/primary photo; contact = additional photo */
  @Column({
    type: "enum",
    enum: ContactPhotoType,
    enumName: "contact_photo_type_enum",
    default: ContactPhotoType.Contact,
  })
  type!: ContactPhotoType;

  @Column({ name: "sort_order", type: "integer", default: 0 })
  sortOrder!: number;

  @Column({ type: "bytea", nullable: true })
  photo!: Buffer | null;

  @Column({ name: "photo_thumbnail", type: "bytea", nullable: true })
  photoThumbnail!: Buffer | null;

  @Column({ name: "created_at", type: "timestamptz", nullable: true })
  createdAt!: Date | null;
}
