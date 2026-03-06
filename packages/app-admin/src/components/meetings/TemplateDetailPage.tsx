import { useRef, useState, useEffect, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  useMeetingTemplateSuspense,
  useInvalidateQueries,
  useUpdateMeetingTemplate,
  useUpdateDocument,
  useDeleteMeetingTemplate,
  unwrapSuspenseData,
} from "@/queries/hooks";
import { Button } from "@/components/ui/button";
import { RichDocumentEditor } from "@/components/ui/rich-document-editor";
import { ExportPdfButton } from "./ExportPdfButton";
import { ArrowLeft, Save, Trash2 } from "lucide-react";

export function TemplateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const template = unwrapSuspenseData(useMeetingTemplateSuspense(id!))!;
  const invalidate = useInvalidateQueries();
  const updateTemplateMutation = useUpdateMeetingTemplate();
  const updateDocumentMutation = useUpdateDocument();
  const deleteTemplateMutation = useDeleteMeetingTemplate();
  const printRef = useRef<HTMLDivElement>(null);

  const [name, setName] = useState(() => template.name ?? "");
  const [content, setContent] = useState(() => template.content ?? "");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Sync from server when not dirty (avoid overwriting user edits). Reset dirty when template id changes (navigated to different template).
  const prevIdRef = useRef(id);
  useEffect(() => {
    if (prevIdRef.current !== id) {
      prevIdRef.current = id;
      setDirty(false);
    }
    if (dirty) return;
    setName(template.name ?? "");
    setContent(template.content ?? "");
  }, [id, template.id, template.name, template.content, dirty]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    setDirty(true);
  };

  const handleContentChange = useCallback((value: string) => {
    setContent(value);
    setDirty(true);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const promises: Promise<unknown>[] = [];
      if (name !== (template.name ?? "")) {
        promises.push(updateTemplateMutation.mutateAsync({ id: id!, body: { name } }));
      }
      if (content !== (template.content ?? "") && template.document_id) {
        promises.push(
          updateDocumentMutation.mutateAsync({
            id: template.document_id,
            body: { content },
          })
        );
      }
      await Promise.all(promises);
      setName(name);
      setContent(content);
      setDirty(false);
      invalidate.invalidateMeetingTemplate(id!);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this template? This cannot be undone.")) return;
    await deleteTemplateMutation.mutateAsync(id!);
    navigate("/meetings/templates");
  };

  const handleBack = (e: React.MouseEvent) => {
    if (dirty && !confirm("You have unsaved changes. Leave without saving?")) {
      e.preventDefault();
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-0">
      {/* Header bar - integrated with editor look */}
      <div className="flex items-center justify-between gap-4 border-b bg-muted/30 px-4 py-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/meetings/templates" onClick={handleBack}>
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <label htmlFor="template-name" className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Name:</span>
            <input
              id="template-name"
              name="template-name"
              type="text"
              value={name ?? ""}
              onChange={handleNameChange}
              placeholder="e.g. Standard Agenda"
              className="min-w-[200px] rounded border bg-background px-2 py-1 text-lg font-semibold outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
              aria-label="Template name"
            />
          </label>
          <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {template.type}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={handleSave}
            disabled={saving || !dirty}
          >
            <Save className="size-4" />
            {saving ? "Saving..." : "Save"}
          </Button>
          <ExportPdfButton
            onPrint={() => printRef.current?.scrollIntoView()}
            label="Export PDF"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Full-height editor - key ensures fresh editor when switching templates */}
      <div ref={printRef} className="flex min-h-0 flex-1 flex-col">
        <RichDocumentEditor
          key={id}
          value={content}
          onChange={handleContentChange}
          placeholder="Enter template content..."
          fullHeight
        />
      </div>
    </div>
  );
}
