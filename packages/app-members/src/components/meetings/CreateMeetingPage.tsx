import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import {
  useMeetingsOptional,
  useMeetingTemplatesOptional,
  useCreateMeeting,
} from "@/queries/hooks";
import { ArrowLeft } from "lucide-react";
import { MeetingTemplateType } from "@satyrsmc/shared/client";

export function CreateMeetingPage() {
  const createMeetingMutation = useCreateMeeting();
  const navigate = useNavigate();
  const { data: meetings = [] } = useMeetingsOptional();
  const { data: templates = [] } = useMeetingTemplatesOptional(MeetingTemplateType.Agenda);

  const [date, setDate] = useState("");
  const [meetingNumber, setMeetingNumber] = useState<number | "">("");
  const [location, setLocation] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [videoConferenceUrl, setVideoConferenceUrl] = useState("");
  const [agendaTemplateId, setAgendaTemplateId] = useState<string>("__none__");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    setDate(today);
    const nextNum =
      meetings.length > 0 ? Math.max(...meetings.map((m) => m.meeting_number), 0) + 1 : 1;
    setMeetingNumber(nextNum);
  }, [meetings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || meetingNumber === "") return;

    setSaving(true);
    try {
      const meeting = await createMeetingMutation.mutateAsync({
        date,
        meeting_number: Number(meetingNumber),
        location: location.trim() || null,
        agenda_template_id: agendaTemplateId === "__none__" ? undefined : agendaTemplateId,
      });
      navigate(`/admin/meetings/${(meeting as { id: string }).id}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/admin/meetings">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Create meeting</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-md space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="meeting-date">Date</Label>
            <DatePicker
              id="meeting-date"
              value={date}
              onChange={setDate}
              placeholder="Pick meeting date"
            />
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
            <Label htmlFor="meeting-location">Location</Label>
            <Input
              id="meeting-location"
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
            <Link to="/admin/meetings">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
