import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { EditableNumberInput } from "@app-admin/components/inputs/EditableNumberInput";

import "@app-admin/index.css";

const meta: Meta<typeof EditableNumberInput> = {
  component: EditableNumberInput,
  title: "App Admin/Inputs/EditableNumberInput",
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof EditableNumberInput>;

export const Default: Story = {
  render: function EditableNumberInputStory() {
    const [value, setValue] = useState(42);
    return (
      <EditableNumberInput
        value={value}
        onChange={setValue}
        label="Quantity"
        className="w-32"
      />
    );
  },
};

export const WithMinMax: Story = {
  render: function EditableNumberInputMinMax() {
    const [value, setValue] = useState(5);
    return (
      <EditableNumberInput
        value={value}
        onChange={setValue}
        label="Attendees"
        min={0}
        max={500}
        step={1}
        className="w-32"
      />
    );
  },
};

export const ReadOnly: Story = {
  args: {
    value: 100,
    onChange: () => {},
    label: "Read only",
    readOnly: true,
  },
};
