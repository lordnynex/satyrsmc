import { useState, useCallback, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  useMeetingSuspense,
  useUpdateDocument,
  useExportDocumentPdf,
  unwrapSuspenseData,
} from "@/queries/hooks";
import { Button } from "@/components/ui/button";
import { RichDocumentEditor } from "./RichDocumentEditor";
import { ArrowLeft, Save, FileDown } from "lucide-react";

type DocumentType = "agenda" | "minutes";

export function MeetingDocumentEditPage({
  documentType,
}: {
  documentType: DocumentType;
}) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const meeting = unwrapSuspenseData(useMeetingSuspense(id!))!;
  const updateDocumentMutation = useUpdateDocument();
  const exportPdfMutation = useExportDocumentPdf();

  const documentId =
    documentType === "agenda"
      ? meeting.agenda_document_id
      : meeting.minutes_document_id;
  const content =
    documentType === "agenda"
      ? meeting.agenda_content
      : meeting.minutes_content ?? "";
  const title = documentType === "agenda" ? "Agenda" : "Minutes";
  const placeholder =
    documentType === "agenda"
      ? "Enter meeting agenda..."
      : "Transcribe meeting minutes...";

  const [editContent, setEditContent] = useState(content);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEditContent(content);
  }, [meeting.id, content]);

  const handleChange = useCallback((value: string) => {
    setEditContent(value);
    setDirty(true);
  }, []);

  const handleSave = async () => {
    if (!documentId) return;
    setSaving(true);
    try {
      await updateDocumentMutation.mutateAsync({
        id: documentId,
        body: { content: editContent },
        meetingId: id,
      });
      setDirty(false);
      navigate(`/meetings/${id}`);
    } finally {
      setSaving(false);
    }
  };

  const handleExportPdf = async () => {
    if (!documentId) return;
    const filename =
      documentType === "agenda"
        ? `meeting-${meeting.meeting_number}-agenda.pdf`
        : `meeting-${meeting.meeting_number}-minutes.pdf`;
    await exportPdfMutation.mutateAsync({ documentId, filename });
  };

  const handleCancel = () => {
    navigate(`/meetings/${id}`);
  };

  if (!documentId) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to={`/meetings/${id}`}>
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <p className="text-muted-foreground">No {title.toLowerCase()} document found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to={`/meetings/${id}`}>
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold">
            Meeting #{meeting.meeting_number} – Edit {title}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPdf}
          >
            <FileDown className="size-4" />
            Export PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || !dirty}
          >
            <Save className="size-4" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <div className="flex min-h-[400px] max-h-[calc(100vh-11rem)] flex-col rounded-md border bg-background">
        <RichDocumentEditor
          value={editContent}
          onChange={handleChange}
          placeholder={placeholder}
          fullHeight
          stickyToolbar
        />
      </div>
    </div>
  );
}
