import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn, expect, userEvent, within } from "storybook/test";
import { Textarea } from "@app-admin/components/ui/textarea";
import { Label } from "@app-admin/components/ui/label";

import "@app-admin/index.css";

const meta: Meta<typeof Textarea> = {
  component: Textarea,
  title: "App Admin/UI/Textarea",
  tags: ["autodocs"],
  parameters: {
    skipMocks: true,
  },
  args: {
    onChange: fn(),
  },
};

export default meta;

type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  args: {
    placeholder: "Type your message here...",
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByPlaceholderText("Type your message here...");

    await userEvent.click(textarea);
    await userEvent.type(textarea, "This is a test message.\nWith multiple lines.");

    await expect(textarea).toHaveValue("This is a test message.\nWith multiple lines.");
    await expect(args.onChange).toHaveBeenCalled();
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
