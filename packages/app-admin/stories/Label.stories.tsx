import type { Meta, StoryObj } from "@storybook/react-vite";
import { Label } from "@app-admin/components/ui/label";
import { Input } from "@app-admin/components/ui/input";

import "@app-admin/index.css";

const meta: Meta<typeof Label> = {
  component: Label,
  title: "App Admin/UI/Label",
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof Label>;

export const Default: Story = {
  args: {
    children: "Label text",
  },
};

export const WithInput: Story = {
  render: (args) => (
    <div className="grid w-full max-w-sm gap-2">
      <Label htmlFor="name" {...args}>
        Name
      </Label>
      <Input id="name" placeholder="Your name" />
    </div>
  ),
};

export const Required: Story = {
  render: (args) => (
    <div className="grid w-full max-w-sm gap-2">
      <Label htmlFor="required" {...args}>
        Required field <span className="text-destructive">*</span>
      </Label>
      <Input id="required" required placeholder="Required" />
    </div>
  ),
};
