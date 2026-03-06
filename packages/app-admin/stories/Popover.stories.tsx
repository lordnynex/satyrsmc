import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@app-admin/components/ui/popover";
import { Button } from "@app-admin/components/ui/button";

import "@app-admin/index.css";

const meta: Meta<typeof Popover> = {
  component: Popover,
  title: "App Admin/UI/Popover",
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof Popover>;

export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Open popover</Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="grid gap-2">
          <h4 className="font-medium leading-none">Popover title</h4>
          <p className="text-sm text-muted-foreground">
            Short description or extra information.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  ),
};

export const WithForm: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Pick a date</Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-2">
          <p className="text-sm font-medium">Quick actions</p>
          <p className="text-xs text-muted-foreground">
            Place form fields or action buttons here.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  ),
};
