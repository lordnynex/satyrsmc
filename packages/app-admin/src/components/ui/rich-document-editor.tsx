import { useCallback, useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TableKit } from "@tiptap/extension-table";
import Heading from "@tiptap/extension-heading";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Strike from "@tiptap/extension-strike";
import Highlight from "@tiptap/extension-highlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import Typography from "@tiptap/extension-typography";
import TextAlign from "@tiptap/extension-text-align";
import Gapcursor from "@tiptap/extension-gapcursor";
import Dropcursor from "@tiptap/extension-dropcursor";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { Indent, FontSize } from "@/lib/tiptap";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Highlighter,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Table,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  CheckSquare,
  IndentIncrease,
  IndentDecrease,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TEXT_COLORS = [
  { name: "Default", color: null },
  { name: "Black", color: "#000000" },
  { name: "Dark Gray", color: "#4a4a4a" },
  { name: "Gray", color: "#9b9b9b" },
  { name: "Red", color: "#e53935" },
  { name: "Orange", color: "#fb8c00" },
  { name: "Yellow", color: "#fdd835" },
  { name: "Green", color: "#43a047" },
  { name: "Blue", color: "#1e88e5" },
  { name: "Purple", color: "#8e24aa" },
  { name: "Pink", color: "#d81b60" },
];

const FONT_SIZES = [
  { label: "Default", value: null },
  { label: "8", value: "8pt" },
  { label: "9", value: "9pt" },
  { label: "10", value: "10pt" },
  { label: "11", value: "11pt" },
  { label: "12", value: "12pt" },
  { label: "14", value: "14pt" },
  { label: "16", value: "16pt" },
  { label: "18", value: "18pt" },
  { label: "20", value: "20pt" },
  { label: "24", value: "24pt" },
  { label: "28", value: "28pt" },
  { label: "32", value: "32pt" },
  { label: "36", value: "36pt" },
  { label: "48", value: "48pt" },
];

const EMPTY_DOC = { type: "doc", content: [{ type: "paragraph" }] };

function parseContent(content: string | null | undefined): object {
  if (!content || content.trim() === "") return EMPTY_DOC;
  try {
    const parsed = JSON.parse(content) as object;
    if (parsed && typeof parsed === "object" && "type" in parsed) return parsed;
  } catch {
    return { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: content }] }] };
  }
  return EMPTY_DOC;
}

interface RichDocumentEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  editable?: boolean;
  /** Ref for the element to capture for PDF export */
  printRef?: React.RefObject<HTMLDivElement | null>;
  /** Optional toolbar actions (e.g. Save, Export) to render in the editor chrome */
  toolbarActions?: React.ReactNode;
  /** Use full height to fill available space */
  fullHeight?: boolean;
  /** Compact display: no border, smaller typography, minimal min-height */
  compact?: boolean;
  /** Keep toolbar visible when scrolling (sticky at top of editor area) */
  stickyToolbar?: boolean;
}

export function RichDocumentEditor({
  value,
  onChange,
  placeholder = "Start typing...",
  className,
  editable = true,
  toolbarActions,
  fullHeight = false,
  compact = false,
  stickyToolbar = false,
}: RichDocumentEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        link: false,
        underline: false,
        strike: false,
        horizontalRule: false,
        gapcursor: false,
        dropcursor: false,
      }),
      Heading.configure({ levels: [1, 2, 3, 4, 5, 6] }),
      TableKit,
      Link.configure({ openOnClick: false }),
      Image,
      Placeholder.configure({ placeholder }),
      Underline,
      Strike,
      Highlight,
      TaskList,
      TaskItem.configure({ nested: true }),
      HorizontalRule,
      Typography,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Gapcursor,
      Dropcursor,
      TextStyle,
      Color,
      FontSize,
      Subscript,
      Superscript,
      Indent.configure({ types: ["paragraph", "heading", "blockquote", "bulletList", "orderedList", "taskList"] }),
    ],
    content: parseContent(value),
    editable,
    editorProps: {
      attributes: {
        class: cn(
          "focus:outline-none caret-foreground [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-4 [&_blockquote]:border-muted [&_blockquote]:pl-4 [&_blockquote]:italic [&_table]:border-collapse [&_th]:border [&_th]:p-2 [&_td]:border [&_td]:p-2",
          compact
            ? "px-2 py-1 [&_h1]:text-base [&_h1]:font-bold [&_h2]:text-sm [&_h2]:font-semibold [&_h3]:text-sm [&_h3]:font-medium [&_p]:my-0.5 [&_p]:text-sm"
            : "px-4 py-3 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-bold [&_h3]:text-lg [&_h3]:font-semibold [&_p]:my-2",
          fullHeight ? "min-h-[400px]" : compact ? "min-h-0" : "min-h-[200px]"
        ),
      },
      handleDOMEvents: {
        copy: (view, event) => {
          const { state } = view;
          const { selection } = state;
          if (selection.empty) return false;
          
          const container = document.createElement("div");
          const sel = window.getSelection();
          
          if (sel && sel.rangeCount > 0) {
            const selectedRange = sel.getRangeAt(0);
            const clonedContent = selectedRange.cloneContents();
            container.appendChild(clonedContent);
            
            container.querySelectorAll("p, h1, h2, h3, h4, h5, h6").forEach((el) => {
              const htmlEl = el as HTMLElement;
              const indent = htmlEl.getAttribute("data-indent");
              htmlEl.style.margin = "0";
              htmlEl.style.lineHeight = "1";
              if (indent) {
                const indentLevel = parseInt(indent, 10);
                if (indentLevel > 0) {
                  htmlEl.style.marginLeft = `${indentLevel * 24}px`;
                }
              }
            });
            container.querySelectorAll("ul, ol").forEach((el) => {
              const htmlEl = el as HTMLElement;
              const indent = htmlEl.getAttribute("data-indent");
              htmlEl.style.margin = "0";
              htmlEl.style.paddingLeft = "24px";
              if (indent) {
                const indentLevel = parseInt(indent, 10);
                if (indentLevel > 0) {
                  htmlEl.style.marginLeft = `${indentLevel * 24}px`;
                }
              }
            });
            container.querySelectorAll("li").forEach((el) => {
              (el as HTMLElement).style.margin = "0";
            });
            
            const plainText = container.textContent || "";
            
            event.clipboardData?.setData("text/html", container.innerHTML);
            event.clipboardData?.setData("text/plain", plainText);
            event.preventDefault();
            return true;
          }
          return false;
        },
      },
      transformPastedHTML(html) {
        const doc = new DOMParser().parseFromString(html, "text/html");
        doc.querySelectorAll("[style]").forEach((el) => {
          const style = el.getAttribute("style") || "";
          const cleaned = style
            .split(";")
            .filter((s) => {
              const prop = s.split(":")[0]?.trim().toLowerCase();
              return prop !== "color" && prop !== "background-color" && prop !== "background";
            })
            .join(";");
          if (cleaned) {
            el.setAttribute("style", cleaned);
          } else {
            el.removeAttribute("style");
          }
        });
        return doc.body.innerHTML;
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (!editor) return;
    const parsed = parseContent(value);
    const current = editor.getJSON();
    const isEmptyIncoming = !value || value.trim() === "";
    const isEffectivelyEmpty = JSON.stringify(parsed) === JSON.stringify(EMPTY_DOC);
    const hasContent =
      (current.content?.length ?? 0) > 1 ||
      ((current.content?.[0] as { content?: unknown[] } | undefined)?.content?.length ?? 0) > 0;
    if ((isEmptyIncoming || isEffectivelyEmpty) && hasContent) return;
    if (JSON.stringify(current) !== JSON.stringify(parsed)) {
      editor.commands.setContent(parsed, { emitUpdate: false });
    }
  }, [value, editor]);

  const handleUpdate = useCallback(() => {
    if (!editor) return;
    const json = editor.getJSON();
    onChange(JSON.stringify(json));
  }, [editor, onChange]);

  useEffect(() => {
    if (!editor) return;
    editor.on("update", handleUpdate);
    return () => {
      editor.off("update", handleUpdate);
    };
  }, [editor, handleUpdate]);

  if (!editor) return null;

  return (
    <div
      className={cn(
        "flex flex-col",
        !compact && "rounded-md border bg-background",
        fullHeight && "min-h-0 flex-1",
        className
      )}
    >
      {editable && (
        <div
          className={cn(
            "flex flex-wrap items-center justify-between gap-2 border-b bg-background p-2",
            stickyToolbar && "sticky top-0 z-10"
          )}
        >
          <div className="flex flex-wrap items-center gap-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive("bold")}
            title="Bold"
          >
            <Bold className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive("italic")}
            title="Italic"
          >
            <Italic className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive("underline")}
            title="Underline"
          >
            <UnderlineIcon className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive("strike")}
            title="Strikethrough"
          >
            <Strikethrough className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            isActive={editor.isActive("highlight")}
            title="Highlight"
          >
            <Highlighter className="size-4" />
          </ToolbarButton>
          <ColorPickerButton editor={editor} />
          <FontSizePickerButton editor={editor} />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleSubscript().run()}
            isActive={editor.isActive("subscript")}
            title="Subscript"
          >
            <SubscriptIcon className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleSuperscript().run()}
            isActive={editor.isActive("superscript")}
            title="Superscript"
          >
            <SuperscriptIcon className="size-4" />
          </ToolbarButton>
          <span className="mx-1 h-5 w-px bg-border" />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive("heading", { level: 1 })}
            title="Heading 1"
          >
            <Heading1 className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive("heading", { level: 2 })}
            title="Heading 2"
          >
            <Heading2 className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive("heading", { level: 3 })}
            title="Heading 3"
          >
            <Heading3 className="size-4" />
          </ToolbarButton>
          <span className="mx-1 h-5 w-px bg-border" />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive("bulletList")}
            title="Bullet list"
          >
            <List className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive("orderedList")}
            title="Numbered list"
          >
            <ListOrdered className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            isActive={editor.isActive("taskList")}
            title="Task list"
          >
            <CheckSquare className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive("blockquote")}
            title="Quote"
          >
            <Quote className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            title="Insert table"
          >
            <Table className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Horizontal rule"
          >
            <Minus className="size-4" />
          </ToolbarButton>
          <span className="mx-1 h-5 w-px bg-border" />
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            isActive={editor.isActive({ textAlign: "left" })}
            title="Align left"
          >
            <AlignLeft className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            isActive={editor.isActive({ textAlign: "center" })}
            title="Align center"
          >
            <AlignCenter className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            isActive={editor.isActive({ textAlign: "right" })}
            title="Align right"
          >
            <AlignRight className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("justify").run()}
            isActive={editor.isActive({ textAlign: "justify" })}
            title="Justify"
          >
            <AlignJustify className="size-4" />
          </ToolbarButton>
          <span className="mx-1 h-5 w-px bg-border" />
          <ToolbarButton
            onClick={() => editor.chain().focus().outdent().run()}
            title="Decrease indent"
          >
            <IndentDecrease className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().indent().run()}
            title="Increase indent"
          >
            <IndentIncrease className="size-4" />
          </ToolbarButton>
          </div>
          {toolbarActions && (
            <div className="flex items-center gap-1 border-l pl-2">
              {toolbarActions}
            </div>
          )}
        </div>
      )}
      <div className={cn("flex-1 min-h-0 overflow-auto", fullHeight && "flex flex-col")}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function ToolbarButton({
  onClick,
  isActive,
  title,
  children,
}: {
  onClick: () => void;
  isActive?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={cn(isActive && "bg-muted")}
    >
      {children}
    </Button>
  );
}

function ColorPickerButton({ editor }: { editor: ReturnType<typeof useEditor> }) {
  const [open, setOpen] = useState(false);
  if (!editor) return null;

  const currentColor = editor.getAttributes("textStyle").color;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          title="Text color"
          aria-label="Text color"
          className="relative"
        >
          <Palette className="size-4" />
          {currentColor && (
            <span
              className="absolute bottom-1 left-1/2 h-0.5 w-3 -translate-x-1/2 rounded-full"
              style={{ backgroundColor: currentColor }}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <div className="grid grid-cols-4 gap-1">
          {TEXT_COLORS.map(({ name, color }) => (
            <button
              key={name}
              type="button"
              title={name}
              onClick={() => {
                if (color) {
                  editor.chain().focus().setColor(color).run();
                } else {
                  editor.chain().focus().unsetColor().run();
                }
                setOpen(false);
              }}
              className={cn(
                "size-6 rounded border transition-transform hover:scale-110",
                currentColor === color && "ring-2 ring-primary ring-offset-1",
                !color && "bg-gradient-to-br from-white to-gray-200"
              )}
              style={color ? { backgroundColor: color } : undefined}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function FontSizePickerButton({ editor }: { editor: ReturnType<typeof useEditor> }) {
  const [open, setOpen] = useState(false);
  if (!editor) return null;

  const currentFontSize = editor.getAttributes("textStyle").fontSize as string | undefined;
  const displaySize = currentFontSize?.replace("pt", "") ?? "";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          title="Font size"
          aria-label="Font size"
          className="h-7 min-w-[3rem] px-2 text-xs font-normal"
        >
          {displaySize || "Size"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-1" align="start">
        <div className="flex flex-col">
          {FONT_SIZES.map(({ label, value }) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                if (value) {
                  editor.chain().focus().setFontSize(value).run();
                } else {
                  editor.chain().focus().unsetFontSize().run();
                }
                setOpen(false);
              }}
              className={cn(
                "rounded px-3 py-1 text-left text-sm hover:bg-muted",
                currentFontSize === value && "bg-muted font-medium"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
