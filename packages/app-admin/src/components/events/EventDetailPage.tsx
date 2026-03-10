import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { extractEmbedUrlFromHtml, getMapEmbedUrl } from "@/lib/maps";
import {
  useEventSuspense,
  useBudgetsOptional,
  useScenariosOptional,
  useUpdateEvent,
  useDeleteEvent,
  useEventAttendeeAdd,
  useEventAttendeeUpdate,
  useEventAttendeeDelete,
  useEventMemberAttendeeAdd,
  useEventMemberAttendeeUpdate,
  useEventMemberAttendeeDelete,
  useEventScheduleItemCreate,
  useEventScheduleItemUpdate,
  useEventScheduleItemDelete,
  useEventIncidentCreate,
  useEventIncidentUpdate,
  useEventIncidentDelete,
  useEventAssetAdd,
  useEventAssetDelete,
  useEventMilestoneCreate,
  useEventMilestoneUpdate,
  useEventMilestoneDelete,
  useEventMilestoneAddMember,
  useEventMilestoneRemoveMember,
  useEventPackingCategoryCreate,
  useEventPackingItemCreate,
  useEventPackingItemUpdate,
  useEventPackingItemDelete,
  useEventVolunteerCreate,
  useEventVolunteerDelete,
  useEventAssignmentCreate,
  useEventAssignmentDelete,
  useEventAssignmentAddMember,
  useEventAssignmentRemoveMember,
  useEventPhotoAdd,
  useEventPhotoDelete,
  unwrapSuspenseData,
  useInvalidateQueries,
} from "@/queries/hooks";
import { EventDetailsCard } from "./EventDetailsCard";
import { EventLocationCard } from "./EventLocationCard";
import { EventMilestonesCard } from "./EventMilestonesCard";
import { EventAssignmentsCard } from "./EventAssignmentsCard";
import { EventPackingCard } from "./EventPackingCard";
import { EventVolunteersCard } from "./EventVolunteersCard";
import { EventPhotosCard } from "./EventPhotosCard";
import { EventNotesCard } from "./EventNotesCard";
import { RideInfoCard } from "./RideInfoCard";
import { RideScheduleCard } from "./RideScheduleCard";
import { RideAttendeesCard } from "./RideAttendeesCard";
import { RideAssetsCard } from "./RideAssetsCard";
import { EventIncidentsCard } from "./EventIncidentsCard";
import { EditEventDialog } from "./EditEventDialog";
import { EventDetailSubNav } from "@/components/layout/EventDetailSubNav";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  if (!id) return null;
  return <EventDetailContent id={id} />;
}

function EventDetailContent({ id }: { id: string }) {
  const navigate = useNavigate();
  const { invalidateEvent } = useInvalidateQueries();
  const event = unwrapSuspenseData(useEventSuspense(id))!;
  const { data: budgets = [] } = useBudgetsOptional();
  const { data: scenarios = [] } = useScenariosOptional();
  const updateEventMutation = useUpdateEvent();
  const deleteEventMutation = useDeleteEvent();
  const addAttendeeMutation = useEventAttendeeAdd();
  const updateAttendeeMutation = useEventAttendeeUpdate();
  const deleteAttendeeMutation = useEventAttendeeDelete();
  const addMemberAttendeeMutation = useEventMemberAttendeeAdd();
  const updateMemberAttendeeMutation = useEventMemberAttendeeUpdate();
  const deleteMemberAttendeeMutation = useEventMemberAttendeeDelete();
  const addScheduleItemMutation = useEventScheduleItemCreate();
  const updateScheduleItemMutation = useEventScheduleItemUpdate();
  const deleteScheduleItemMutation = useEventScheduleItemDelete();
  const addIncidentMutation = useEventIncidentCreate();
  const updateIncidentMutation = useEventIncidentUpdate();
  const deleteIncidentMutation = useEventIncidentDelete();
  const addAssetMutation = useEventAssetAdd();
  const deleteAssetMutation = useEventAssetDelete();
  const addMilestoneMutation = useEventMilestoneCreate();
  const updateMilestoneMutation = useEventMilestoneUpdate();
  const deleteMilestoneMutation = useEventMilestoneDelete();
  const addMilestoneMemberMutation = useEventMilestoneAddMember();
  const removeMilestoneMemberMutation = useEventMilestoneRemoveMember();
  const addPackingCategoryMutation = useEventPackingCategoryCreate();
  const addPackingItemMutation = useEventPackingItemCreate();
  const updatePackingItemMutation = useEventPackingItemUpdate();
  const deletePackingItemMutation = useEventPackingItemDelete();
  const addVolunteerMutation = useEventVolunteerCreate();
  const deleteVolunteerMutation = useEventVolunteerDelete();
  const createAssignmentMutation = useEventAssignmentCreate();
  const deleteAssignmentMutation = useEventAssignmentDelete();
  const addAssignmentMemberMutation = useEventAssignmentAddMember();
  const removeAssignmentMemberMutation = useEventAssignmentRemoveMember();
  const addPhotoMutation = useEventPhotoAdd();
  const deletePhotoMutation = useEventPhotoDelete();
  const [editOpen, setEditOpen] = useState(false);

  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editYear, setEditYear] = useState<number | "">("");
  const [editEventDate, setEditEventDate] = useState("");
  const [editEventUrl, setEditEventUrl] = useState("");
  const [editEventLocation, setEditEventLocation] = useState("");
  const [editEventLocationEmbed, setEditEventLocationEmbed] = useState("");
  const [editGaTicketCost, setEditGaTicketCost] = useState<string>("");
  const [editDayPassCost, setEditDayPassCost] = useState<string>("");
  const [editGaTicketsSold, setEditGaTicketsSold] = useState<string>("");
  const [editDayPassesSold, setEditDayPassesSold] = useState<string>("");
  const [editBudgetId, setEditBudgetId] = useState<string>("");
  const [editScenarioId, setEditScenarioId] = useState<string>("");
  const [editPlanningNotes, setEditPlanningNotes] = useState("");
  const [editEventType, setEditEventType] = useState<string>("badger");
  const [editStartLocation, setEditStartLocation] = useState("");
  const [editEndLocation, setEditEndLocation] = useState("");
  const [editFacebookEventUrl, setEditFacebookEventUrl] = useState("");
  const [editPreRideEventId, setEditPreRideEventId] = useState("");
  const [editRideCost, setEditRideCost] = useState<string>("");
  const [editShowOnWebsite, setEditShowOnWebsite] = useState(false);

  useEffect(() => {
    setEditName(event.name);
    setEditDescription(event.description ?? "");
    setEditYear(event.year ?? "");
    setEditEventDate(event.event_date ?? "");
    setEditEventUrl(event.event_url ?? "");
    setEditEventLocation(event.event_location ?? "");
    setEditEventLocationEmbed(event.event_location_embed ?? "");
    setEditGaTicketCost(event.ga_ticket_cost != null ? String(event.ga_ticket_cost) : "");
    setEditDayPassCost(event.day_pass_cost != null ? String(event.day_pass_cost) : "");
    setEditGaTicketsSold(event.ga_tickets_sold != null ? String(event.ga_tickets_sold) : "");
    setEditDayPassesSold(event.day_passes_sold != null ? String(event.day_passes_sold) : "");
    setEditBudgetId(event.budget_id ?? "");
    setEditScenarioId(event.scenario_id ?? "");
    setEditPlanningNotes(event.planning_notes ?? "");
    setEditEventType(event.event_type ?? "badger");
    setEditStartLocation(event.start_location ?? "");
    setEditEndLocation(event.end_location ?? "");
    setEditFacebookEventUrl(event.facebook_event_url ?? "");
    setEditPreRideEventId(event.pre_ride_event_id ?? "");
    setEditRideCost(event.ride_cost != null ? String(event.ride_cost) : "");
    setEditShowOnWebsite(event.show_on_website ?? false);
  }, [event]);

  const refresh = async () => {
    await invalidateEvent(id);
  };

  const handleSaveEdit = async () => {
    await updateEventMutation.mutateAsync({
      id,
      body: {
        name: editName,
        description: editDescription || undefined,
        year: editYear === "" ? undefined : Number(editYear),
        event_date: editEventDate || undefined,
        event_url: editEventUrl || undefined,
        event_location: editEventLocation || undefined,
        event_location_embed: extractEmbedUrlFromHtml(editEventLocationEmbed) || undefined,
        ga_ticket_cost: editGaTicketCost === "" ? undefined : parseFloat(editGaTicketCost),
        day_pass_cost: editDayPassCost === "" ? undefined : parseFloat(editDayPassCost),
        ga_tickets_sold: editGaTicketsSold === "" ? undefined : parseFloat(editGaTicketsSold),
        day_passes_sold: editDayPassesSold === "" ? undefined : parseFloat(editDayPassesSold),
        budget_id: editBudgetId || undefined,
        scenario_id: editScenarioId || undefined,
        planning_notes: editPlanningNotes || undefined,
        event_type: editEventType as "badger" | "anniversary" | "pioneer_run" | "rides",
        start_location: editStartLocation || undefined,
        end_location: editEndLocation || undefined,
        facebook_event_url: editFacebookEventUrl || undefined,
        pre_ride_event_id: editPreRideEventId || undefined,
        ride_cost: editRideCost === "" ? undefined : parseFloat(editRideCost),
        show_on_website: editShowOnWebsite,
      },
    });
    setEditOpen(false);
    refresh();
  };

  const handleAddAttendee = async (contactId: string, waiverSigned?: boolean) => {
    await addAttendeeMutation.mutateAsync({
      eventId: id,
      body: { contact_id: contactId, waiver_signed: waiverSigned },
    });
    refresh();
  };

  const handleUpdateAttendeeWaiver = async (attendeeId: string, waiverSigned: boolean) => {
    await updateAttendeeMutation.mutateAsync({
      eventId: id,
      attendeeId,
      body: { waiver_signed: waiverSigned },
    });
    refresh();
  };

  const handleRemoveAttendee = async (attendeeId: string) => {
    await deleteAttendeeMutation.mutateAsync({ eventId: id, attendeeId });
    refresh();
  };

  const handleAddMemberAttendee = async (memberId: string, waiverSigned?: boolean) => {
    await addMemberAttendeeMutation.mutateAsync({
      eventId: id,
      body: { member_id: memberId, waiver_signed: waiverSigned },
    });
    refresh();
  };

  const handleUpdateMemberAttendeeWaiver = async (attendeeId: string, waiverSigned: boolean) => {
    await updateMemberAttendeeMutation.mutateAsync({
      eventId: id,
      attendeeId,
      body: { waiver_signed: waiverSigned },
    });
    refresh();
  };

  const handleRemoveMemberAttendee = async (attendeeId: string) => {
    await deleteMemberAttendeeMutation.mutateAsync({ eventId: id, attendeeId });
    refresh();
  };

  const handleAddScheduleItem = async (body: {
    scheduled_time: string;
    label: string;
    location?: string;
  }) => {
    await addScheduleItemMutation.mutateAsync({ eventId: id, body });
    refresh();
  };

  const handleUpdateScheduleItem = async (
    scheduleId: string,
    body: { scheduled_time?: string; label?: string; location?: string | null }
  ) => {
    await updateScheduleItemMutation.mutateAsync({ eventId: id, scheduleId, body });
    refresh();
  };

  const handleDeleteScheduleItem = async (scheduleId: string) => {
    await deleteScheduleItemMutation.mutateAsync({ eventId: id, scheduleId });
    refresh();
  };

  const handleAddIncident = async (payload: {
    type: string;
    severity: string;
    summary: string;
    details?: string;
    occurred_at?: string;
  }) => {
    await addIncidentMutation.mutateAsync({ eventId: id, body: payload });
    refresh();
  };

  const handleUpdateIncident = async (
    incidentId: string,
    payload: {
      type?: string;
      severity?: string;
      summary?: string;
      details?: string;
      occurred_at?: string | null;
    }
  ) => {
    await updateIncidentMutation.mutateAsync({
      eventId: id,
      incidentId,
      body: payload,
    });
    refresh();
  };

  const handleDeleteIncident = async (incidentId: string) => {
    await deleteIncidentMutation.mutateAsync({ eventId: id, incidentId });
    refresh();
  };

  const handleAddAsset = async (file: File) => {
    await addAssetMutation.mutateAsync({ eventId: id, file });
    refresh();
  };

  const handleDeleteAsset = async (assetId: string) => {
    await deleteAssetMutation.mutateAsync({ eventId: id, assetId });
    refresh();
  };

  const handleAddMilestone = async (payload: {
    month: number;
    year: number;
    description: string;
    due_date: string;
  }) => {
    await addMilestoneMutation.mutateAsync({ eventId: id, body: payload });
    refresh();
  };

  const handleToggleMilestoneComplete = async (mid: string, completed: boolean) => {
    await updateMilestoneMutation.mutateAsync({
      eventId: id,
      mid,
      body: { completed },
    });
    refresh();
  };

  const handleDeleteMilestone = async (mid: string) => {
    await deleteMilestoneMutation.mutateAsync({ eventId: id, mid });
    refresh();
  };

  const handleEditMilestone = async (
    mid: string,
    payload: { month: number; year: number; description: string; due_date: string }
  ) => {
    await updateMilestoneMutation.mutateAsync({
      eventId: id,
      mid,
      body: payload,
    });
    refresh();
  };

  const handleAddMemberToMilestone = async (mid: string, memberId: string) => {
    await addMilestoneMemberMutation.mutateAsync({
      eventId: id,
      mid,
      memberId,
    });
    refresh();
  };

  const handleRemoveMemberFromMilestone = async (mid: string, memberId: string) => {
    await removeMilestoneMemberMutation.mutateAsync({
      eventId: id,
      mid,
      memberId,
    });
    refresh();
  };

  const handleAddPackingCategory = async (name: string) => {
    await addPackingCategoryMutation.mutateAsync({ eventId: id, body: { name } });
    refresh();
  };

  const handleAddPackingItem = async (payload: {
    category_id: string;
    name: string;
    quantity?: number;
    note?: string;
  }) => {
    await addPackingItemMutation.mutateAsync({ eventId: id, body: payload });
    refresh();
  };

  const handleEditPackingItem = async (
    pid: string,
    payload: { category_id?: string; name?: string; quantity?: number; note?: string }
  ) => {
    await updatePackingItemMutation.mutateAsync({
      eventId: id,
      pid,
      body: payload,
    });
    refresh();
  };

  const handleTogglePackingLoaded = async (pid: string, loaded: boolean) => {
    await updatePackingItemMutation.mutateAsync({
      eventId: id,
      pid,
      body: { loaded },
    });
    refresh();
  };

  const handleDeletePackingItem = async (pid: string) => {
    await deletePackingItemMutation.mutateAsync({ eventId: id, pid });
    refresh();
  };

  const handleAddVolunteer = async (payload: { name: string; department: string }) => {
    await addVolunteerMutation.mutateAsync({ eventId: id, body: payload });
    refresh();
  };

  const handleDeleteVolunteer = async (vid: string) => {
    await deleteVolunteerMutation.mutateAsync({ eventId: id, vid });
    refresh();
  };

  const handleCreateRole = async (payload: { name: string; category: "planning" | "during" }) => {
    await createAssignmentMutation.mutateAsync({ eventId: id, body: payload });
    refresh();
  };

  const handleDeleteRole = async (aid: string) => {
    await deleteAssignmentMutation.mutateAsync({ eventId: id, aid });
    refresh();
  };

  const handleAddMemberToRole = async (aid: string, memberId: string) => {
    await addAssignmentMemberMutation.mutateAsync({
      eventId: id,
      aid,
      memberId,
    });
    refresh();
  };

  const handleRemoveMemberFromRole = async (aid: string, memberId: string) => {
    await removeAssignmentMemberMutation.mutateAsync({
      eventId: id,
      aid,
      memberId,
    });
    refresh();
  };

  const handleAddPhoto = async (file: File) => {
    await addPhotoMutation.mutateAsync({ eventId: id, file });
    refresh();
  };

  const handleDeletePhoto = async (photoId: string) => {
    await deletePhotoMutation.mutateAsync({ eventId: id, photoId });
    refresh();
  };

  const handleDeleteEvent = async () => {
    if (!confirm(`Delete "${event.name}"? This cannot be undone.`)) return;
    await deleteEventMutation.mutateAsync(id);
    navigate(event.event_type === "rides" ? "/events/rides" : "/events");
  };

  const mapEmbedUrl = event.event_location_embed ?? getMapEmbedUrl(event.event_location);
  const budgetName = budgets.find((b) => b.id === event.budget_id)?.name;
  const scenarioName = scenarios.find((s) => s.id === event.scenario_id)?.name;

  return (
    <div className="space-y-6">
      <EventDetailSubNav eventType={event.event_type} />
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/events")}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{event.name}</h1>
          {event.year != null && (
            <p className="text-muted-foreground text-sm">{event.year}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleDeleteEvent} className="text-destructive hover:text-destructive">
            <Trash2 className="size-4" />
            Delete
          </Button>
          <Button onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" />
            Edit Event
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <EventDetailsCard
          event={event}
          budgetName={budgetName}
          scenarioName={scenarioName}
        />
        {event.event_type === "rides" && <RideInfoCard event={event} />}
        {mapEmbedUrl && <EventLocationCard mapEmbedUrl={mapEmbedUrl} />}
      </div>

      {event.event_type === "rides" && (
        <>
          <RideScheduleCard
            eventId={id}
            items={event.ride_schedule_items ?? []}
            onAdd={handleAddScheduleItem}
            onUpdate={handleUpdateScheduleItem}
            onDelete={handleDeleteScheduleItem}
          />
          <RideAttendeesCard
            eventId={id}
            attendees={event.event_attendees ?? []}
            memberAttendees={event.ride_member_attendees ?? []}
            onAdd={handleAddAttendee}
            onUpdateWaiver={handleUpdateAttendeeWaiver}
            onRemove={handleRemoveAttendee}
            onAddMember={handleAddMemberAttendee}
            onUpdateMemberWaiver={handleUpdateMemberAttendeeWaiver}
            onRemoveMember={handleRemoveMemberAttendee}
          />
          <RideAssetsCard
            eventId={id}
            eventName={event.name}
            assets={event.event_assets ?? []}
            onAdd={handleAddAsset}
            onDelete={handleDeleteAsset}
          />
          <EventIncidentsCard
            incidents={event.incidents ?? []}
            onAddIncident={handleAddIncident}
            onUpdateIncident={handleUpdateIncident}
            onDeleteIncident={handleDeleteIncident}
          />
        </>
      )}

      {event.event_type !== "rides" && (
        <>
          <EventMilestonesCard
            event={event}
            onRefresh={refresh}
            onToggleComplete={handleToggleMilestoneComplete}
            onDelete={handleDeleteMilestone}
            onAdd={handleAddMilestone}
            onEdit={handleEditMilestone}
            onAddMember={handleAddMemberToMilestone}
            onRemoveMember={handleRemoveMemberFromMilestone}
          />
          <EventAssignmentsCard
            event={event}
            onCreateRole={handleCreateRole}
            onDeleteRole={handleDeleteRole}
            onAddMember={handleAddMemberToRole}
            onRemoveMember={handleRemoveMemberFromRole}
          />
          <EventPackingCard
            event={event}
            onAddCategory={handleAddPackingCategory}
            onAddItem={handleAddPackingItem}
            onEditItem={handleEditPackingItem}
            onToggleLoaded={handleTogglePackingLoaded}
            onDeleteItem={handleDeletePackingItem}
          />
          <EventVolunteersCard
            event={event}
            onDelete={handleDeleteVolunteer}
            onAdd={handleAddVolunteer}
          />
        </>
      )}

      <EventPhotosCard
        eventId={id}
        eventName={event.name}
        photos={event.event_photos ?? []}
        onAddPhoto={handleAddPhoto}
        onDeletePhoto={handleDeletePhoto}
      />

      <EventNotesCard planningNotes={event.planning_notes} />

      <EditEventDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        editName={editName}
        setEditName={setEditName}
        editDescription={editDescription}
        setEditDescription={setEditDescription}
        editYear={editYear}
        setEditYear={setEditYear}
        editEventDate={editEventDate}
        setEditEventDate={setEditEventDate}
        editEventUrl={editEventUrl}
        setEditEventUrl={setEditEventUrl}
        editEventLocation={editEventLocation}
        setEditEventLocation={setEditEventLocation}
        editEventLocationEmbed={editEventLocationEmbed}
        setEditEventLocationEmbed={setEditEventLocationEmbed}
        editGaTicketCost={editGaTicketCost}
        setEditGaTicketCost={setEditGaTicketCost}
        editDayPassCost={editDayPassCost}
        setEditDayPassCost={setEditDayPassCost}
        editGaTicketsSold={editGaTicketsSold}
        setEditGaTicketsSold={setEditGaTicketsSold}
        editDayPassesSold={editDayPassesSold}
        setEditDayPassesSold={setEditDayPassesSold}
        editBudgetId={editBudgetId}
        setEditBudgetId={setEditBudgetId}
        editScenarioId={editScenarioId}
        setEditScenarioId={setEditScenarioId}
        editPlanningNotes={editPlanningNotes}
        setEditPlanningNotes={setEditPlanningNotes}
        editEventType={editEventType}
        setEditEventType={setEditEventType}
        editStartLocation={editStartLocation}
        setEditStartLocation={setEditStartLocation}
        editEndLocation={editEndLocation}
        setEditEndLocation={setEditEndLocation}
        editFacebookEventUrl={editFacebookEventUrl}
        setEditFacebookEventUrl={setEditFacebookEventUrl}
        editPreRideEventId={editPreRideEventId}
        setEditPreRideEventId={setEditPreRideEventId}
        editRideCost={editRideCost}
        setEditRideCost={setEditRideCost}
        editShowOnWebsite={editShowOnWebsite}
        setEditShowOnWebsite={setEditShowOnWebsite}
        budgets={budgets}
        scenarios={scenarios}
        onSave={handleSaveEdit}
      />
    </div>
  );
}
