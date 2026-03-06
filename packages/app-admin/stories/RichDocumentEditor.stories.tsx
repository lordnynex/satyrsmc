import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { RichDocumentEditor } from "@app-admin/components/ui/rich-document-editor";
import { Button } from "@app-admin/components/ui/button";
import { Save } from "lucide-react";

import "@app-admin/index.css";

const meta: Meta<typeof RichDocumentEditor> = {
  component: RichDocumentEditor,
  title: "App Admin/UI/RichDocumentEditor",
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
};

export default meta;

type Story = StoryObj<typeof RichDocumentEditor>;

const sampleContent = JSON.stringify({
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 1 },
      content: [{ type: "text", text: "Meeting Agenda" }],
    },
    {
      type: "paragraph",
      content: [{ type: "text", text: "Welcome to the monthly board meeting." }],
    },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Topics" }],
    },
    {
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [
            { type: "paragraph", content: [{ type: "text", text: "Budget review" }] },
          ],
        },
        {
          type: "listItem",
          content: [
            { type: "paragraph", content: [{ type: "text", text: "New initiatives" }] },
          ],
        },
        {
          type: "listItem",
          content: [
            { type: "paragraph", content: [{ type: "text", text: "Open discussion" }] },
          ],
        },
      ],
    },
  ],
});

function ControlledEditor(props: Omit<React.ComponentProps<typeof RichDocumentEditor>, "value" | "onChange">) {
  const [value, setValue] = useState("");
  return <RichDocumentEditor value={value} onChange={setValue} {...props} />;
}

function EditorWithContent(props: Omit<React.ComponentProps<typeof RichDocumentEditor>, "value" | "onChange">) {
  const [value, setValue] = useState(sampleContent);
  return <RichDocumentEditor value={value} onChange={setValue} {...props} />;
}

function EditorWithToolbarActions(props: Omit<React.ComponentProps<typeof RichDocumentEditor>, "value" | "onChange" | "toolbarActions">) {
  const [value, setValue] = useState(sampleContent);
  return (
    <RichDocumentEditor
      value={value}
      onChange={setValue}
      toolbarActions={
        <Button size="sm" variant="default">
          <Save className="size-4 mr-1" />
          Save
        </Button>
      }
      {...props}
    />
  );
}

export const Default: Story = {
  render: () => <ControlledEditor placeholder="Start typing..." />,
};

export const WithContent: Story = {
  render: () => <EditorWithContent />,
};

export const WithToolbarActions: Story = {
  render: () => <EditorWithToolbarActions />,
};

export const FullHeight: Story = {
  render: () => (
    <div className="h-[500px] flex flex-col">
      <EditorWithContent fullHeight />
    </div>
  ),
};

export const Compact: Story = {
  render: () => <EditorWithContent compact />,
};

export const ReadOnly: Story = {
  render: () => <EditorWithContent editable={false} />,
};

export const StickyToolbar: Story = {
  render: () => (
    <div className="h-[300px] overflow-auto border rounded-md">
      <EditorWithContent stickyToolbar fullHeight />
    </div>
  ),
};

export const Empty: Story = {
  render: () => <ControlledEditor placeholder="Write your document here..." />,
};

export const DarkBackground: Story = {
  render: () => (
    <div className="dark bg-background p-4 rounded-md">
      <EditorWithContent />
    </div>
  ),
  parameters: {
    backgrounds: { default: "dark" },
  },
};
