/**
 * Shared test helpers for tRPC procedure tests.
 * Re-exports BAD_ID and create* helpers from services/__tests__/helpers
 * so trpc tests can seed data. Add any trpc-specific input builders here if needed.
 */

export {
  BAD_ID,
  MINIMAL_JPEG_BUFFER,
  createContact,
  createMember,
  createEvent,
  createBudget,
  createScenario,
  createMailingList,
  createMeeting,
  createMeetingTemplate,
  createCommittee,
  createSitePage,
  createBlogPost,
  createQrCode,
} from "../../services/__tests__/helpers";
