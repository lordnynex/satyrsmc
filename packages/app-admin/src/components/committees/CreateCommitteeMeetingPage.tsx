import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useCommitteeSuspense, unwrapSuspenseData } from "@/queries/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { useMeetingTemplatesOptional, useCreateCommitteeMeeting } from "@/queries/hooks";
import { ArrowLeft } from "lucide-react";

export function CreateCommitteeMeetingPage() {
  const createCommitteeMeetingMutation = useCreateCommitteeMeeting();
  const { id: committeeId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const committee = unwrapSuspenseData(useCommitteeSuspense(committeeId!))!;
  const { data: templates = [] } = useMeetingTemplatesOptional("agenda");

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [meetingNumber, setMeetingNumber] = useState<number | "">("");
  const [location, setLocation] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [videoConferenceUrl, setVideoConferenceUrl] = useState("");
  const [agendaTemplateId, setAgendaTemplateId] = useState("__none__");
  const [saving, setSaving] = useState(false);

  const meetings = committee.meetings ?? [];
  useEffect(() => {
    const nextNum =
      meetings.length > 0 ? Math.max(...meetings.map((m) => m.meeting_number ?? 0), 0) + 1 : 1;
    setMeetingNumber(nextNum);
  }, [meetings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || meetingNumber === "") return;

    setSaving(true);
    try {
      const meeting = await createCommitteeMeetingMutation.mutateAsync({
        committeeId: committeeId!,
        body: {
          date,
          meeting_number: Number(meetingNumber),
          location: location.trim() || null,
          start_time: startTime.trim() || null,
          end_time: endTime.trim() || null,
          video_conference_url: videoConferenceUrl.trim() || null,
          agenda_template_id: agendaTemplateId === "__none__" ? undefined : agendaTemplateId,
        },
      });
      navigate(`/meetings/committees/${committeeId}/meetings/${(meeting as { id: string }).id}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to={`/meetings/committees/${committeeId}`}>
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">New meeting – {committee.name}</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-md space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <DatePicker id="date" value={date} onChange={setDate} placeholder="Pick meeting date" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="meeting-number">Meeting number</Label>
            <Input
              id="meeting-number"
              type="number"
              min={1}
              value={meetingNumber}
              onChange={(e) =>
                setMeetingNumber(e.target.value === "" ? "" : parseInt(e.target.value, 10))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Meeting location"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-time">Start time</Label>
              <Input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-time">End time</Label>
              <Input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="video-url">Video conference URL</Label>
            <Input
              id="video-url"
              type="url"
              value={videoConferenceUrl}
              onChange={(e) => setVideoConferenceUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <Label>Agenda template</Label>
            <Select value={agendaTemplateId} onValueChange={setAgendaTemplateId}>
              <SelectTrigger>
                <SelectValue placeholder="Start blank" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Start blank</SelectItem>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Creating..." : "Create meeting"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link to={`/meetings/committees/${committeeId}`}>Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
