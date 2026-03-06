import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Calendar } from "@app-admin/components/ui/calendar";
import type { DateRange } from "react-day-picker";

import "@app-admin/index.css";

const meta: Meta<typeof Calendar> = {
  component: Calendar,
  title: "App Admin/UI/Calendar",
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof Calendar>;

export const Single: Story = {
  render: function SingleCalendar() {
    const [date, setDate] = useState<Date | undefined>(new Date());
    return (
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        className="rounded-md border"
      />
    );
  },
};

export const Range: Story = {
  render: function RangeCalendar() {
    const [range, setRange] = useState<DateRange | undefined>({
      from: new Date(),
      to: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    });
    return (
      <Calendar
        mode="range"
        selected={range}
        onSelect={setRange}
        className="rounded-md border"
        numberOfMonths={2}
      />
    );
  },
};
