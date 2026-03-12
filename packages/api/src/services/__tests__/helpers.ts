import type { Contact } from "@satyrsmc/shared/dto/admin/contact";
import type { Event } from "@satyrsmc/shared/dto/admin/event";
import type { MailingList } from "@satyrsmc/shared/dto/admin/mailingList";
import type { Member } from "@satyrsmc/shared/dto/admin/member";
import type { Api } from "../api";

/** Non-existent UUID for negative tests (never inserted). */
export const BAD_ID = "00000000-0000-0000-0000-000000000000";

/** Minimal valid 1x1 JPEG (base64) for photo/asset tests. */
const MINIMAL_JPEG_BASE64 =
  "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==";
export const MINIMAL_JPEG_BUFFER = Buffer.from(MINIMAL_JPEG_BASE64, "base64");

function unique(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function createContact(
  api: Api,
  overrides: { display_name?: string; [key: string]: unknown } = {},
): Promise<Contact> {
  const display_name = overrides.display_name ?? unique("Contact");
  const contact = await api.contacts.create({ ...overrides, display_name });
  return contact!;
}

export async function createMember(
  api: Api,
  overrides: { name?: string; [key: string]: unknown } = {},
): Promise<Member> {
  const name = overrides.name ?? unique("Member");
  const member = await api.members.create({ ...overrides, name });
  return member!;
}

export async function createEvent(
  api: Api,
  overrides: { name?: string; [key: string]: unknown } = {},
): Promise<Event> {
  const name = overrides.name ?? unique("Event");
  const event = await api.events.create({ ...overrides, name });
  return event!;
}

export async function createBudget(
  api: Api,
  overrides: { name?: string; year?: number; [key: string]: unknown } = {},
) {
  const name = overrides.name ?? unique("Budget");
  const year = (overrides.year as number) ?? new Date().getFullYear();
  const budget = await api.budgets.create({ ...overrides, name, year });
  return budget;
}

export async function createScenario(
  api: Api,
  overrides: { name?: string; [key: string]: unknown } = {},
) {
  const name = overrides.name ?? unique("Scenario");
  const scenario = await api.scenarios.create({ ...overrides, name });
  return scenario;
}

export async function createMailingList(
  api: Api,
  overrides: { name?: string; list_type?: string; [key: string]: unknown } = {},
): Promise<MailingList> {
  const name = overrides.name ?? unique("MailingList");
  const list_type = (overrides.list_type as "static" | "dynamic") ?? "static";
  const list = await api.mailingLists.create({
    ...overrides,
    name,
    list_type,
    delivery_type: (overrides.delivery_type as "physical" | "email" | "both") ?? "email",
  });
  return list!;
}

export async function createMeeting(
  api: Api,
  overrides: { date?: string; meeting_number?: number; [key: string]: unknown } = {},
) {
  const date = (overrides.date as string) ?? new Date().toISOString().slice(0, 10);
  const meeting_number = (overrides.meeting_number as number) ?? 1;
  const meeting = await api.meetings.create({ ...overrides, date, meeting_number });
  return meeting;
}

export async function createMeetingTemplate(
  api: Api,
  overrides: {
    name?: string;
    type?: "agenda" | "minutes";
    content?: string;
    [key: string]: unknown;
  } = {},
) {
  const name = overrides.name ?? unique("Template");
  const type = overrides.type ?? "agenda";
  const content = (overrides.content as string) ?? "";
  const template = await api.meetingTemplates.create({ ...overrides, name, type, content });
  return template;
}

export async function createCommittee(
  api: Api,
  overrides: { name?: string; formed_date?: string; [key: string]: unknown } = {},
) {
  const name = overrides.name ?? unique("Committee");
  const formed_date = (overrides.formed_date as string) ?? new Date().toISOString().slice(0, 10);
  const committee = await api.committees.create({ ...overrides, name, formed_date });
  return committee;
}

export async function createSitePage(
  api: Api,
  overrides: { slug?: string; title?: string; [key: string]: unknown } = {},
) {
  const slug = (overrides.slug as string) ?? unique("page").toLowerCase().replace(/\s/g, "-");
  const title = (overrides.title as string) ?? unique("Page");
  const page = await api.sitePages.create({
    ...overrides,
    slug,
    title,
    body: (overrides.body as string) ?? "",
  });
  return page;
}

export async function createBlogPost(
  api: Api,
  overrides: {
    slug?: string;
    title?: string;
    published_at?: string | null;
    [key: string]: unknown;
  } = {},
) {
  const slug = (overrides.slug as string) ?? unique("post").toLowerCase().replace(/\s/g, "-");
  const title = (overrides.title as string) ?? unique("Post");
  const post = await api.blog.create({
    ...overrides,
    slug,
    title,
    body: (overrides.body as string) ?? "",
    published_at: overrides.published_at ?? null,
  });
  return post;
}

export async function createQrCode(
  api: Api,
  overrides: { url?: string; name?: string | null; [key: string]: unknown } = {},
) {
  const url = (overrides.url as string) ?? "https://example.com";
  const name = (overrides.name as string | null) ?? unique("QR");
  const qr = await api.qrCodes.create({ ...overrides, url, name });
  return qr;
}
