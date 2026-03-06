import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter } from "react-router-dom";
import { MemberChip } from "@app-admin/components/members/MemberChip";

import "@app-admin/index.css";

const meta: Meta<typeof MemberChip> = {
  component: MemberChip,
  title: "App Admin/Members/MemberChip",
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof MemberChip>;

export const WithPhoto: Story = {
  args: {
    memberId: "1",
    name: "Jane Doe",
    photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jane",
    clickable: true,
  },
};

export const NoPhoto: Story = {
  args: {
    memberId: "2",
    name: "John Smith",
    photo: null,
    clickable: true,
  },
};

export const NonClickable: Story = {
  args: {
    memberId: "0",
    name: "All Members",
    photo: null,
    clickable: false,
  },
};

export const LongName: Story = {
  args: {
    memberId: "3",
    name: "Christopher Alexander Montgomery III",
    photo: null,
    clickable: true,
  },
};
