import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn, expect, userEvent, within } from "storybook/test";
import { Input } from "@app-admin/components/ui/input";
import { Label } from "@app-admin/components/ui/label";

import "@app-admin/index.css";

const meta: Meta<typeof Input> = {
  component: Input,
  title: "App Admin/UI/Input",
  tags: ["autodocs"],
  parameters: {
    skipMocks: true,
  },
  args: {
    onChange: fn(),
  },
};

export default meta;

type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    placeholder: "Enter text...",
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText("Enter text...");

    await userEvent.click(input);
    await userEvent.type(input, "Hello World");

    await expect(input).toHaveValue("Hello World");
    await expect(args.onChange).toHaveBeenCalled();
  },
};

export const WithLabel: Story = {
  render: (args) => (
    <div className="grid w-full max-w-sm gap-2">
      <Label htmlFor="email">Email</Label>
      <Input id="email" type="email" placeholder="you@example.com" {...args} />
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    placeholder: "Disabled",
    disabled: true,
  },
};

export const WithValue: Story = {
  args: {
    defaultValue: "Some value",
  },
};

export const TypePassword: Story = {
  args: {
    type: "password",
    placeholder: "Password",
  },
};
