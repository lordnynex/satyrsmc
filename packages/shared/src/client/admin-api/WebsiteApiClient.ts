import type { TrpcClient } from "../trpc";

export class WebsiteApiClient {
  constructor(private client: TrpcClient) {}

  listPages() {
    return this.client.admin.website.listPages.query();
  }

  getPageById(id: string) {
    return this.client.admin.website.getPageById.query({ id });
  }

  createPage(body: Record<string, unknown>) {
    return this.client.admin.website.createPage.mutate(body as never);
  }

  updatePage(id: string, body: Record<string, unknown>) {
    return this.client.admin.website.updatePage.mutate({ id, ...body } as never);
  }

  deletePage(id: string) {
    return this.client.admin.website.deletePage.mutate({ id });
  }

  getEventsFeed() {
    return this.client.website.getEventsFeed.query();
  }

  getMembersFeed() {
    return this.client.website.getMembersFeed.query();
  }

  getBlogPublished() {
    return this.client.website.getBlogPublished.query();
  }

  getBlogBySlug(slug: string) {
    return this.client.website.getBlogBySlug.query({ slug });
  }

  getPages() {
    return this.client.website.getPages.query();
  }

  listBlogAll() {
    return this.client.admin.website.listBlogAll.query();
  }

  getBlogById(id: string) {
    return this.client.admin.website.getBlogById.query({ id });
  }

  createBlogPost(body: Record<string, unknown>) {
    return this.client.admin.website.createBlogPost.mutate(body as never);
  }

  updateBlogPost(id: string, body: Record<string, unknown>) {
    return this.client.admin.website.updateBlogPost.mutate({
      id,
      ...body,
    } as never);
  }

  deleteBlogPost(id: string) {
    return this.client.admin.website.deleteBlogPost.mutate({ id });
  }

  getMenus() {
    return this.client.admin.website.getMenus.query();
  }

  updateMenu(
    key: string,
    items: {
      label: string;
      url?: string | null;
      internal_ref?: string | null;
      sort_order?: number;
    }[],
  ) {
    return this.client.admin.website.updateMenu.mutate({ key, items });
  }

  getSettings() {
    return this.client.admin.website.getSettings.query();
  }

  updateSettings(body: Record<string, unknown>) {
    return this.client.admin.website.updateSettings.mutate(body as never);
  }

  listContactSubmissions() {
    return this.client.admin.website.listContactSubmissions.query();
  }

  listContactMemberSubmissions() {
    return this.client.admin.website.listContactMemberSubmissions.query();
  }
}
