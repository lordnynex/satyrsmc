import { Entity, PrimaryColumn } from "typeorm";

@Entity("contact_tags")
export class ContactTag {
  @PrimaryColumn({ name: "contact_id", type: "text" })
  contactId!: string;

  @PrimaryColumn({ name: "tag_id", type: "text" })
  tagId!: string;
}
