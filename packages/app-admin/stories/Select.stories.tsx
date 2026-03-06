import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn, expect, userEvent, within } from "storybook/test";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@app-admin/components/ui/select";

import "@app-admin/index.css";

const meta: Meta<typeof Select> = {
  component: Select,
  title: "App Admin/UI/Select",
  tags: ["autodocs"],
  parameters: {
    skipMocks: true,
  },
};

export default meta;

type Story = StoryObj<typeof Select>;

export const Default: Story = {
  args: {
    onValueChange: fn(),
  },
  render: (args) => (
    <Select onValueChange={args.onValueChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select option" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="one">Option One</SelectItem>
        <SelectItem value="two">Option Two</SelectItem>
        <SelectItem value="three">Option Three</SelectItem>
      </SelectContent>
    </Select>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("combobox");

    await userEvent.click(trigger);

    const option = await within(document.body).findByText("Option Two");
    await userEvent.click(option);

    await expect(args.onValueChange).toHaveBeenCalledWith("two");
    await expect(trigger).toHaveTextContent("Option Two");
  },
};

export const WithGroups: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[220px]">
        <SelectValue placeholder="Select fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Fruits</SelectLabel>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
          <SelectItem value="orange">Orange</SelectItem>
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>Vegetables</SelectLabel>
          <SelectItem value="carrot">Carrot</SelectItem>
          <SelectItem value="potato">Potato</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
};

export const Small: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[140px]" size="sm">
        <SelectValue placeholder="Small" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="a">A</SelectItem>
        <SelectItem value="b">B</SelectItem>
      </SelectContent>
    </Select>
  ),
};
