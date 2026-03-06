import type { Preview } from "@storybook/react-vite";
import addonPerformancePanel from "@github-ui/storybook-addon-performance-panel";
import { withMockApi } from "../packages/app-admin/src/storybook/mockApiDecorator";
import { withMockTrpc } from "../packages/app-admin/src/storybook/mockTrpcDecorator";

// Wrapper that skips decorators in docs mode to prevent infinite loading
const withMockTrpcSafe: typeof withMockTrpc = (Story, context) => {
  if (context.viewMode === "docs") {
    return Story();
  }
  return withMockTrpc(Story, context);
};

const withMockApiSafe: typeof withMockApi = (Story, context) => {
  if (context.viewMode === "docs") {
    return Story();
  }
  return withMockApi(Story, context);
};

const performanceAddon = addonPerformancePanel();
const perfDecorators = performanceAddon.decorators
  ? Array.isArray(performanceAddon.decorators)
    ? performanceAddon.decorators
    : [performanceAddon.decorators]
  : [];

const preview: Preview = {
  decorators: [
    ...perfDecorators,
    withMockTrpcSafe,
    withMockApiSafe,
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
