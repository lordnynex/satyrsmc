import type { Decorator } from "@storybook/react-vite";
import { ApiProvider, createMockApi } from "../data/api";

/**
 * Wraps stories with a mock API context so components using useApi() render
 * without a real tRPC client or backend. Use for layout and panel stories
 * that call useApi() (e.g. ContactsLayout, panels using mailingLists, etc.).
 */
export const withMockApi: Decorator = (Story) => (
  <ApiProvider api={createMockApi()}>
    <Story />
  </ApiProvider>
);
