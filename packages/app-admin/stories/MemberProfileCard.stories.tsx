import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemberProfileCard } from "@app-admin/components/members/MemberProfileCard";
import { mockMembers } from "./mockData";

import "@app-admin/index.css";

const meta: Meta<typeof MemberProfileCard> = {
  component: MemberProfileCard,
  title: "App Admin/Members/MemberProfileCard",
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof MemberProfileCard>;

export const FullProfile: Story = {
  args: {
    member: mockMembers[0],
    onPhotoClick: () => console.log("Photo clicked"),
  },
};

export const MinimalProfile: Story = {
  args: {
    member: mockMembers[1],
  },
};

export const BabyProfile: Story = {
  args: {
    member: mockMembers[2],
  },
};
