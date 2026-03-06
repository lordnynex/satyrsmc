import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetBody,
} from "@app-admin/components/ui/sheet";
import { Button } from "@app-admin/components/ui/button";

import "@app-admin/index.css";

const meta: Meta<typeof Sheet> = {
  component: Sheet,
  title: "App Admin/UI/Sheet",
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof Sheet>;

export const Left: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open left sheet</Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Side panel</SheetTitle>
          <SheetDescription>Content slides in from the left.</SheetDescription>
        </SheetHeader>
        <SheetBody>
          <p className="text-sm text-muted-foreground">
            Panel body content goes here.
          </p>
        </SheetBody>
      </SheetContent>
    </Sheet>
  ),
};

export const Right: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open right sheet</Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>Adjust filters for the current view.</SheetDescription>
        </SheetHeader>
        <SheetBody>
          <p className="text-sm text-muted-foreground">
            Filter options and form fields.
          </p>
        </SheetBody>
      </SheetContent>
    </Sheet>
  ),
};
