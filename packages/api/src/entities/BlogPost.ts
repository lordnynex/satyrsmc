import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("blog_posts")
export class BlogPost {
  @PrimaryColumn("text")
  id!: string;

  @Column({ type: "text", unique: true })
  slug!: string;

  @Column({ type: "text" })
  title!: string;

  @Column({ type: "text", nullable: true })
  excerpt!: string | null;

  @Column({ type: "text" })
  body!: string;

  @Column({ name: "published_at", type: "timestamptz", nullable: true })
  publishedAt!: Date | null;

  @Column({ name: "meta_title", type: "text", nullable: true })
  metaTitle!: string | null;

  @Column({ name: "meta_description", type: "text", nullable: true })
  metaDescription!: string | null;

  @Column({ name: "created_at", type: "timestamptz", nullable: true })
  createdAt!: Date | null;

  @Column({ name: "updated_at", type: "timestamptz", nullable: true })
  updatedAt!: Date | null;
}
