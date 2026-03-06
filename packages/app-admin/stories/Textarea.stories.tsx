import type { Meta, StoryObj } from "@storybook/react-vite";
import { Textarea } from "@app-admin/components/ui/textarea";
import { Label } from "@app-admin/components/ui/label";

import "@app-admin/index.css";

const meta: Meta<typeof Textarea> = {
  component: Textarea,
  title: "App Admin/UI/Textarea",
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  args: {
    placeholder: "Type your message here...",
  },
};

export const WithLabel: Story = {
  render: (args) => (
    <div className="grid w-full max-w-sm gap-2">
      <Label htmlFor="message">Message</Label>
      <Textarea id="message" placeholder="Your message" {...args} />
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    placeholder: "Disabled textarea",
    disabled: true,
  },
};

export const WithValue: Story = {
  args: {
    defaultValue: "Some longer text that was already entered into the textarea.",
  },
};
