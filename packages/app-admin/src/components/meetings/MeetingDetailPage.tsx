import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  useMeetingSuspense,
  useUpdateMeeting,
  useExportDocumentPdf,
  useDeleteMeeting,
  unwrapSuspenseData,
} from "@/queries/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { RichDocumentEditor } from "@/components/ui/rich-document-editor";
import { MotionsCard } from "./MotionsCard";
import { ActionItemsCard } from "./ActionItemsCard";
import { NewBusinessCard } from "./NewBusinessCard";
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock,
  FileDown,
  MapPin,
  Pencil,
  Trash2,
  Video,
  X,
} from "lucide-react";
import { formatDateOnly } from "@/lib/date-utils";

export function MeetingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const meeting = unwrapSuspenseData(useMeetingSuspense(id!))!;
  const updateMeetingMutation = useUpdateMeeting();
  const exportPdfMutation = useExportDocumentPdf();
  const deleteMeetingMutation = useDeleteMeeting();

  const [editingMetadata, setEditingMetadata] = useState(false);
  const [metadataSaving, setMetadataSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAgenda, setDeleteAgenda] = useState(true);
  const [deleteMinutes, setDeleteMinutes] = useState(true);
  const [deleteMotions, setDeleteMotions] = useState(true);
  const [deleteActionItems, setDeleteActionItems] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [meetingNumber, setMeetingNumber] = useState<number | "">(meeting.meeting_number);
  const [date, setDate] = useState(meeting.date);
  const [location, setLocation] = useState(meeting.location ?? "");
  const [startTime, setStartTime] = useState(meeting.start_time ?? "");
  const [endTime, setEndTime] = useState(meeting.end_time ?? "");
  const [videoConferenceUrl, setVideoConferenceUrl] = useState(meeting.video_conference_url ?? "");

  const handleMetadataSave = async () => {
    const num = Number(meetingNumber);
    if (Number.isNaN(num) || num < 1) {
      setMeetingNumber(meeting.meeting_number);
      setEditingMetadata(false);
      return;
    }
    setMetadataSaving(true);
    try {
      await updateMeetingMutation.mutateAsync({
        id: id!,
        body: {
          meeting_number: num,
          date,
          location: location.trim() || null,
          start_time: startTime.trim() || null,
          end_time: endTime.trim() || null,
          video_conference_url: videoConferenceUrl.trim() || null,
        },
      });
      setEditingMetadata(false);
    } finally {
      setMetadataSaving(false);
    }
  };

  const handleMetadataCancel = () => {
    setMeetingNumber(meeting.meeting_number);
    setDate(meeting.date);
    setLocation(meeting.location ?? "");
    setStartTime(meeting.start_time ?? "");
    setEndTime(meeting.end_time ?? "");
    setVideoConferenceUrl(meeting.video_conference_url ?? "");
    setEditingMetadata(false);
  };

  const handleAgendaExportPdf = async () => {
    if (!meeting.agenda_document_id) return;
    const filename = `meeting-${meeting.meeting_number}-agenda.pdf`;
    await exportPdfMutation.mutateAsync({
      documentId: meeting.agenda_document_id,
      filename,
    });
  };

  const handleMinutesExportPdf = async () => {
    if (!meeting.minutes_document_id) return;
    const filename = `meeting-${meeting.meeting_number}-minutes.pdf`;
    await exportPdfMutation.mutateAsync({
      documentId: meeting.minutes_document_id,
      filename,
    });
  };

  const isMinutesEmpty = (): boolean => {
    const content = meeting.minutes_content?.trim();
    if (!content) return true;
    try {
      const parsed = JSON.parse(meeting.minutes_content ?? "{}");
      return (
        parsed?.type === "doc" &&
        Array.isArray(parsed?.content) &&
        parsed.content.length === 1 &&
        parsed.content[0]?.type === "paragraph" &&
        !parsed.content[0].content?.length
      );
    } catch {
      return true;
    }
  };

  const hasMinutes =
    Boolean(meeting.minutes_document_id) || !isMinutesEmpty();

  const isMeetingInPast = (): boolean => {
    const meetingDate = new Date(meeting.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    meetingDate.setHours(0, 0, 0, 0);
    return meetingDate < today;
  };

  const shouldCollapseAgenda = hasMinutes && isMeetingInPast();

  const [agendaOpen, setAgendaOpen] = useState(!shouldCollapseAgenda);
  const [minutesOpen, setMinutesOpen] = useState(true);

  useEffect(() => {
    setAgendaOpen(!shouldCollapseAgenda);
  }, [shouldCollapseAgenda]);

  const minutesExportDisabled =
    !meeting.minutes_document_id || isMinutesEmpty();

  const handleDeleteMeeting = async () => {
    setDeleting(true);
    try {
      await deleteMeetingMutation.mutateAsync({
        id: id!,
        delete_agenda: deleteAgenda,
        delete_minutes: deleteMinutes,
      });
      navigate("/meetings");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 print:gap-4">
      {/* Sticky sub-navigation header */}
      <div className="sticky top-16 z-10 -mx-4 -mt-4 flex flex-col gap-4 border-b border-border/50 bg-background/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:-mx-6 md:-mt-6 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/meetings">
                <ArrowLeft className="size-4" />
              </Link>
            </Button>

            {editingMetadata ? (
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Meeting #</span>
                  <Input
                    type="number"
                    min={1}
                    value={meetingNumber === "" ? "" : meetingNumber}
                    onChange={(e) =>
                      setMeetingNumber(
                        e.target.value === ""
                          ? ""
                          : parseInt(e.target.value, 10) || ""
                      )
                    }
                    className="h-9 w-20"
                  />
                </div>
                <DatePicker
                  value={date}
                  onChange={setDate}
                  placeholder="Date"
                  className="h-9 w-auto min-w-[140px]"
                />
                <Input
                  placeholder="Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="h-9 w-48"
                />
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="h-9 w-28"
                  title="Start time"
                />
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="h-9 w-28"
                  title="End time"
                />
                <Input
                  type="url"
                  placeholder="Video URL"
                  value={videoConferenceUrl}
                  onChange={(e) => setVideoConferenceUrl(e.target.value)}
                  className="h-9 w-48"
                />
                <Button
                  size="sm"
                  onClick={handleMetadataSave}
                  disabled={metadataSaving}
                >
                  {metadataSaving ? "Saving..." : "Save"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMetadataCancel}
                  disabled={metadataSaving}
                >
                  <X className="size-4" />
                  Cancel
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDeleteAgenda(true);
                    setDeleteMinutes(true);
                    setDeleteDialogOpen(true);
                  }}
                  disabled={metadataSaving}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                <h1 className="text-2xl font-semibold">
                  Meeting #{meeting.meeting_number}
                </h1>
                <span className="text-muted-foreground">
                  {formatDateOnly(meeting.date)}
                </span>
                {meeting.location && (
                  <span className="text-muted-foreground">
                    • {meeting.location}
                  </span>
                )}
                {(meeting.start_time || meeting.end_time) && (
                  <span className="text-muted-foreground">
                    • {[meeting.start_time, meeting.end_time].filter(Boolean).join(" – ")}
                  </span>
                )}
                {meeting.video_conference_url && (
                  <a
                    href={meeting.video_conference_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm"
                  >
                    Video call
                  </a>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingMetadata(true)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="size-4" />
                  Edit
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Meeting info header */}
      <div className="rounded-lg border bg-muted/30 px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <span className="flex items-center gap-2 text-sm">
            <Calendar className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">Date</span>
            <span className="font-medium">{formatDateOnly(meeting.date)}</span>
          </span>
          {(meeting.start_time || meeting.end_time) && (
            <span className="flex items-center gap-2 text-sm">
              <Clock className="size-4 text-muted-foreground" />
              <span className="text-muted-foreground">Time</span>
              <span className="font-medium">
                {[meeting.start_time, meeting.end_time].filter(Boolean).join(" – ")}
              </span>
            </span>
          )}
          {meeting.location && (
            <span className="flex items-center gap-2 text-sm">
              <MapPin className="size-4 text-muted-foreground" />
              <span className="text-muted-foreground">Location</span>
              <span className="font-medium">{meeting.location}</span>
            </span>
          )}
          {meeting.video_conference_url && (
            <a
              href={meeting.video_conference_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Video className="size-4" />
              Join video call
            </a>
          )}
        </div>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent showCloseButton={!deleting}>
          <DialogHeader>
            <DialogTitle>Delete meeting?</DialogTitle>
            <DialogDescription>
              This cannot be undone. The following will be permanently deleted:
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-2 text-muted-foreground text-sm">
            <li className="flex items-center gap-2">
              <input
                type="checkbox"
                id="delete-agenda"
                checked={deleteAgenda}
                onChange={(e) => setDeleteAgenda(e.target.checked)}
                className="rounded border-input"
              />
              <label htmlFor="delete-agenda" className="cursor-pointer">
                Agenda
              </label>
            </li>
            <li className="flex items-center gap-2">
              <input
                type="checkbox"
                id="delete-minutes"
                checked={deleteMinutes}
                onChange={(e) => setDeleteMinutes(e.target.checked)}
                className="rounded border-input"
              />
              <label htmlFor="delete-minutes" className="cursor-pointer">
                Minutes
              </label>
            </li>
            <li className="flex items-center gap-2">
              <input
                type="checkbox"
                id="delete-motions"
                checked={deleteMotions}
                disabled
                className="rounded border-input"
              />
              <label htmlFor="delete-motions" className="cursor-pointer">
                Motions (always removed with meeting)
              </label>
            </li>
            <li className="flex items-center gap-2">
              <input
                type="checkbox"
                id="delete-action-items"
                checked={deleteActionItems}
                disabled
                className="rounded border-input"
              />
              <label htmlFor="delete-action-items" className="cursor-pointer">
                Action items (always removed with meeting)
              </label>
            </li>
          </ul>
          <DialogFooter showCloseButton={false}>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteMeeting}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete meeting"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {meeting.previous_meeting_id && (
        <p className="text-sm text-muted-foreground">
          <Link
            to={`/meetings/${meeting.previous_meeting_id}`}
            className="text-primary hover:underline"
          >
            ← Previous meeting minutes
          </Link>
        </p>
      )}

      {/* Collapsible Agenda section */}
      <Collapsible open={agendaOpen} onOpenChange={setAgendaOpen}>
        <div className="rounded-lg border">
          <div className="flex w-full items-center justify-between gap-2 rounded-t-lg px-3 py-2">
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 text-left hover:opacity-80"
              >
                {agendaOpen ? (
                  <ChevronDown className="size-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="size-4 text-muted-foreground" />
                )}
                <h2 className="text-base font-medium">Agenda</h2>
              </button>
            </CollapsibleTrigger>
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={handleAgendaExportPdf}
              >
                <FileDown className="size-3.5" />
                Export
              </Button>
              <Button variant="ghost" size="sm" className="h-7 px-2" asChild>
                <Link to={`/meetings/${id}/agenda/edit`}>
                  <Pencil className="size-3.5" />
                  Edit
                </Link>
              </Button>
            </div>
          </div>
          <CollapsibleContent>
            <div className="border-t px-3 py-2">
              <RichDocumentEditor
                value={meeting.agenda_content}
                onChange={() => {}}
                placeholder="No agenda yet."
                editable={false}
                compact
              />
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Collapsible Minutes section */}
      <Collapsible open={minutesOpen} onOpenChange={setMinutesOpen}>
        <div className="rounded-lg border">
          <div className="flex w-full items-center justify-between gap-2 rounded-t-lg px-3 py-2">
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 text-left hover:opacity-80"
              >
                {minutesOpen ? (
                  <ChevronDown className="size-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="size-4 text-muted-foreground" />
                )}
                <h2 className="text-base font-medium">Minutes</h2>
              </button>
            </CollapsibleTrigger>
            <div className="flex items-center gap-1.5">
              {meeting.minutes_document_id && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={handleMinutesExportPdf}
                    disabled={minutesExportDisabled}
                  >
                    <FileDown className="size-3.5" />
                    Export
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 px-2" asChild>
                    <Link to={`/meetings/${id}/minutes/edit`}>
                      <Pencil className="size-3.5" />
                      Edit
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
          <CollapsibleContent>
            <div className="border-t px-3 py-2">
              <RichDocumentEditor
                value={meeting.minutes_content ?? ""}
                onChange={() => {}}
                placeholder="No minutes yet."
                editable={false}
                compact
              />
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      <MotionsCard meetingId={meeting.id} motions={meeting.motions} />
      <ActionItemsCard meetingId={meeting.id} actionItems={meeting.action_items} />
      <NewBusinessCard meetingId={meeting.id} />
    </div>
  );
}
