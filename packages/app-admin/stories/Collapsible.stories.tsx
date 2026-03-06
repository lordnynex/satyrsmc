import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@app-admin/components/ui/collapsible";
import { Button } from "@app-admin/components/ui/button";

import "@app-admin/index.css";

const meta: Meta<typeof Collapsible> = {
  component: Collapsible,
  title: "App Admin/UI/Collapsible",
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof Collapsible>;

export const Default: Story = {
  render: () => (
    <Collapsible className="w-[360px]">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Toggle section</span>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="icon-sm">
            ▼
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent>
        <p className="text-sm text-muted-foreground pt-2">
          This content can be expanded and collapsed.
        </p>
      </CollapsibleContent>
    </Collapsible>
  ),
};

export const DefaultOpen: Story = {
  render: () => (
    <Collapsible defaultOpen className="w-[360px]">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Open by default</span>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="icon-sm">
            ▼
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent>
        <p className="text-sm text-muted-foreground pt-2">
          This section starts expanded.
        </p>
      </CollapsibleContent>
    </Collapsible>
  ),
};
