import type { MigrationInterface } from "typeorm";
import type { QueryRunner } from "typeorm";

/**
 * Adds blog_posts table for website blog.
 */
export class AddBlogPosts1740000018000 implements MigrationInterface {
  name = "AddBlogPosts1740000018000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS blog_posts (
        id TEXT PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        excerpt TEXT,
        body TEXT NOT NULL,
        published_at TEXT,
        meta_title TEXT,
        meta_description TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE IF EXISTS blog_posts");
  }
}
