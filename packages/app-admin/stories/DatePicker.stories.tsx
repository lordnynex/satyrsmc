import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { DatePicker } from "@app-admin/components/ui/date-picker";

import "@app-admin/index.css";

const meta: Meta<typeof DatePicker> = {
  component: DatePicker,
  title: "App Admin/UI/DatePicker",
  tags: ["autodocs"],
  parameters: {
    skipMocks: true,
  },
};

export default meta;

type Story = StoryObj<typeof DatePicker>;

export const Default: Story = {
  render: function DatePickerStory() {
    const [value, setValue] = useState("");
    return (
      <div className="w-[280px]">
        <DatePicker value={value} onChange={setValue} placeholder="Pick a date" />
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button");

    await userEvent.click(trigger);

    const calendar = await within(document.body).findByRole("grid");
    await expect(calendar).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");
  },
};

export const WithValue: Story = {
  render: function DatePickerWithValue() {
    const [value, setValue] = useState("2025-06-15");
    return (
      <div className="w-[280px]">
        <DatePicker value={value} onChange={setValue} placeholder="Pick a date" />
      </div>
    );
  },
};

export const Disabled: Story = {
  args: {
    value: "",
    onChange: () => {},
    placeholder: "Disabled",
    disabled: true,
  },
};
