import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@app-admin/components/ui/dropdown-menu";
import { Button } from "@app-admin/components/ui/button";

import "@app-admin/index.css";

const meta: Meta<typeof DropdownMenu> = {
  component: DropdownMenu,
  title: "App Admin/UI/DropdownMenu",
  tags: ["autodocs"],
  parameters: {
    skipMocks: true,
  },
};

export default meta;

type Story = StoryObj<typeof DropdownMenu>;

export const Default: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Open menu</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>My account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Profile</DropdownMenuItem>
        <DropdownMenuItem>Settings</DropdownMenuItem>
        <DropdownMenuItem>Billing</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">Log out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Open menu" });

    await userEvent.click(trigger);

    const menu = await within(document.body).findByRole("menu");
    await expect(menu).toBeInTheDocument();
    await expect(within(menu).getByText("My account")).toBeInTheDocument();
    await expect(within(menu).getByRole("menuitem", { name: "Profile" })).toBeInTheDocument();
    await expect(within(menu).getByRole("menuitem", { name: "Settings" })).toBeInTheDocument();
    await expect(within(menu).getByRole("menuitem", { name: "Log out" })).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");
    await expect(within(document.body).queryByRole("menu")).not.toBeInTheDocument();
  },
};

export const WithDisabledItem: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Actions</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuItem>Edit</DropdownMenuItem>
        <DropdownMenuItem>Duplicate</DropdownMenuItem>
        <DropdownMenuItem disabled>Delete (disabled)</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};
