import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@app-admin/components/ui/tabs";

import "@app-admin/index.css";

const meta: Meta<typeof Tabs> = {
  component: Tabs,
  title: "App Admin/UI/Tabs",
  tags: ["autodocs"],
  parameters: {
    skipMocks: true,
  },
};

export default meta;

type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="one" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="one">One</TabsTrigger>
        <TabsTrigger value="two">Two</TabsTrigger>
        <TabsTrigger value="three">Three</TabsTrigger>
      </TabsList>
      <TabsContent value="one">Content for tab one.</TabsContent>
      <TabsContent value="two">Content for tab two.</TabsContent>
      <TabsContent value="three">Content for tab three.</TabsContent>
    </Tabs>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText("Content for tab one.")).toBeVisible();

    const tabTwo = canvas.getByRole("tab", { name: "Two" });
    await userEvent.click(tabTwo);

    await expect(canvas.getByText("Content for tab two.")).toBeVisible();
    await expect(canvas.queryByText("Content for tab one.")).not.toBeVisible();

    const tabThree = canvas.getByRole("tab", { name: "Three" });
    await userEvent.click(tabThree);

    await expect(canvas.getByText("Content for tab three.")).toBeVisible();
  },
};

export const LineVariant: Story = {
  render: () => (
    <Tabs defaultValue="account" className="w-[400px]">
      <TabsList variant="line">
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
        <TabsTrigger value="billing">Billing</TabsTrigger>
      </TabsList>
      <TabsContent value="account">Account settings and profile.</TabsContent>
      <TabsContent value="settings">App and notification settings.</TabsContent>
      <TabsContent value="billing">Billing and plans.</TabsContent>
    </Tabs>
  ),
};
