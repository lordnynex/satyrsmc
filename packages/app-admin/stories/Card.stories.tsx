import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
} from "@app-admin/components/ui/card";
import { Button } from "@app-admin/components/ui/button";

import "@app-admin/index.css";

const meta: Meta<typeof Card> = {
  component: Card,
  title: "App Admin/UI/Card",
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <Card className="w-[360px]">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Short description for the card content.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">Main content goes here.</p>
      </CardContent>
      <CardFooter>
        <Button size="sm">Action</Button>
      </CardFooter>
    </Card>
  ),
};

export const WithAction: Story = {
  render: () => (
    <Card className="w-[360px]">
      <CardHeader>
        <CardTitle>Card with action</CardTitle>
        <CardDescription>Header includes an action in the top-right.</CardDescription>
        <CardAction>
          <Button variant="ghost" size="icon-sm">
            ⋮
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-sm">Content area.</p>
      </CardContent>
    </Card>
  ),
};

export const ContentOnly: Story = {
  render: () => (
    <Card className="w-[360px]">
      <CardContent className="pt-6">
        <p className="text-sm">A simple card with only content.</p>
      </CardContent>
    </Card>
  ),
};
