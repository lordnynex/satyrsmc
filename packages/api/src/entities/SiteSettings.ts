import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("site_settings")
export class SiteSettings {
  @PrimaryColumn({ type: "text", default: "default" })
  id!: string;

  @Column({ name: "title", type: "text", nullable: true })
  title!: string | null;

  @Column({ name: "logo_url", type: "text", nullable: true })
  logoUrl!: string | null;

  @Column({ name: "footer_text", type: "text", nullable: true })
  footerText!: string | null;

  @Column({ name: "default_meta_description", type: "text", nullable: true })
  defaultMetaDescription!: string | null;

  @Column({ name: "contact_email", type: "text", nullable: true })
  contactEmail!: string | null;

  @Column({ name: "updated_at", type: "timestamptz", nullable: true })
  updatedAt!: Date | null;
}
