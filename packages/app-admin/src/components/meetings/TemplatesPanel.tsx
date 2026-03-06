import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateMeetingTemplate,
  useDeleteMeetingTemplate,
  useMeetingTemplatesSuspense,
  unwrapSuspenseData,
} from "@/queries/hooks";
import { RichDocumentEditor } from "@/components/ui/rich-document-editor";

const EMPTY_DOC = JSON.stringify({ type: "doc", content: [{ type: "paragraph" }] });

export function TemplatesPanel() {
  const navigate = useNavigate();
  const templates = unwrapSuspenseData(useMeetingTemplatesSuspense()) ?? [];
  const createTemplateMutation = useCreateMeetingTemplate();
  const deleteTemplateMutation = useDeleteMeetingTemplate();
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<"agenda" | "minutes">("agenda");
  const [content, setContent] = useState(EMPTY_DOC);
  const [saving, setSaving] = useState(false);

  const agendaTemplates = templates.filter((t) => t.type === "agenda");
  const minutesTemplates = templates.filter((t) => t.type === "minutes");

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      const t = await createTemplateMutation.mutateAsync({
        name: trimmed,
        type,
        content: content || EMPTY_DOC,
      });
      setCreateOpen(false);
      setName("");
      setContent(EMPTY_DOC);
      navigate(`/meetings/templates/${(t as { id: string }).id}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm("Delete this template?")) return;
    await deleteTemplateMutation.mutateAsync(templateId);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Templates</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          New template
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="mb-3 text-lg font-medium">Agenda templates</h2>
          <ul className="space-y-2">
            {agendaTemplates.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <Link
                  to={`/meetings/templates/${t.id}`}
                  className="flex items-center gap-2 font-medium text-primary hover:underline"
                >
                  <FileText className="size-4" />
                  {t.name}
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(t.id)}
                >
                  Delete
                </Button>
              </li>
            ))}
          </ul>
          {agendaTemplates.length === 0 && (
            <p className="text-sm text-muted-foreground">No agenda templates.</p>
          )}
        </div>
        <div>
          <h2 className="mb-3 text-lg font-medium">Minutes templates</h2>
          <ul className="space-y-2">
            {minutesTemplates.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <Link
                  to={`/meetings/templates/${t.id}`}
                  className="flex items-center gap-2 font-medium text-primary hover:underline"
                >
                  <FileText className="size-4" />
                  {t.name}
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(t.id)}
                >
                  Delete
                </Button>
              </li>
            ))}
          </ul>
          {minutesTemplates.length === 0 && (
            <p className="text-sm text-muted-foreground">No minutes templates.</p>
          )}
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Standard Agenda"
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as "agenda" | "minutes")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agenda">Agenda</SelectItem>
                  <SelectItem value="minutes">Minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={saving || !name.trim()}>
              Create
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
