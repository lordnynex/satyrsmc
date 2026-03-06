import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter } from "react-router-dom";
import { MemberCard } from "@app-admin/components/members/MemberCard";
import { mockMembers } from "./mockData";

import "@app-admin/index.css";

const meta: Meta<typeof MemberCard> = {
  component: MemberCard,
  title: "App Admin/Members/MemberCard",
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

type Story = StoryObj<typeof MemberCard>;

export const WithPhoto: Story = {
  args: {
    member: mockMembers[0],
    onNavigate: (id) => console.log("Navigate to member", id),
  },
};

export const NoPhoto: Story = {
  args: {
    member: mockMembers[1],
    onNavigate: (id) => console.log("Navigate to member", id),
  },
};

export const WithChair: Story = {
  args: {
    member: { ...mockMembers[0], position: "President" },
    onNavigate: (id) => console.log("Navigate to member", id),
    isChair: true,
  },
};

export const Baby: Story = {
  args: {
    member: mockMembers[2],
    onNavigate: (id) => console.log("Navigate to member", id),
  },
};
