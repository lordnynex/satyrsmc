import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { trpc } from "@/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, ArrowUpDown, Clock, Search, Users } from "lucide-react";
import { MemberChipPopover } from "@/components/members/MemberChipPopover";
import {
  AttendeeStatus,
  PaymentStatus,
  RegistrationMethod,
  RsvpLogCode,
} from "@satyrsmc/shared/lib/enums";
import type { EventAttendeeAdmin } from "@satyrsmc/shared/dto/admin/event";

// --- Labels ---

const STATUS_LABELS: Record<string, string> = {
  [AttendeeStatus.Pending]: "Pending",
  [AttendeeStatus.Yes]: "Confirmed",
  [AttendeeStatus.No]: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  [AttendeeStatus.Pending]: "bg-yellow-100 text-yellow-800",
  [AttendeeStatus.Yes]: "bg-green-100 text-green-800",
  [AttendeeStatus.No]: "bg-red-100 text-red-800",
};

const PAYMENT_LABELS: Record<string, string> = {
  [PaymentStatus.NotRequired]: "N/A",
  [PaymentStatus.Pending]: "Pending",
  [PaymentStatus.Confirmed]: "Paid",
  [PaymentStatus.RefundRequested]: "Refund Req.",
  [PaymentStatus.Refunded]: "Refunded",
};

const PAYMENT_COLORS: Record<string, string> = {
  [PaymentStatus.NotRequired]: "text-muted-foreground",
  [PaymentStatus.Pending]: "text-yellow-600",
  [PaymentStatus.Confirmed]: "text-green-600",
  [PaymentStatus.RefundRequested]: "text-orange-600",
  [PaymentStatus.Refunded]: "text-muted-foreground",
};

const REGISTRATION_METHOD_LABELS: Record<string, string> = {
  [RegistrationMethod.Auth]: "Website",
  [RegistrationMethod.EventToken]: "Token",
  [RegistrationMethod.Invitation]: "Invitation",
};

const TRAVEL_LABELS: Record<string, string> = {
  motorcycle: "Motorcycle",
  car_truck: "Car/Truck",
  rv_camper: "RV/Camper",
};

const LOG_CODE_LABELS: Record<string, string> = {
  [RsvpLogCode.Registered]: "Registered",
  [RsvpLogCode.MatchedToContact]: "Matched to contact",
  [RsvpLogCode.NewContactCreated]: "New contact created",
  [RsvpLogCode.PaymentConfirmed]: "Payment confirmed",
  [RsvpLogCode.RefundRequested]: "Refund requested",
  [RsvpLogCode.RefundProcessed]: "Refund processed",
  [RsvpLogCode.Cancelled]: "Cancelled",
  [RsvpLogCode.AdminCancelled]: "Admin cancelled",
  [RsvpLogCode.AccountLinked]: "Account linked",
  [RsvpLogCode.StatusChanged]: "Status changed",
};

// --- Column definitions ---

function SortableHeader({
  column,
  children,
}: {
  column: { toggleSorting: (desc?: boolean) => void; getIsSorted: () => false | "asc" | "desc" };
  children: React.ReactNode;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {children}
      <ArrowUpDown className="ml-1 size-3" />
    </Button>
  );
}

const columns: ColumnDef<EventAttendeeAdmin>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <SortableHeader column={column}>Name</SortableHeader>,
    accessorFn: (row) =>
      row.member?.name ?? row.contact?.display_name ?? row.contact_id ?? "Unknown",
    cell: ({ row }) => {
      const a = row.original;
      if (a.is_member && a.member) {
        return (
          <MemberChipPopover
            memberId={a.member.id}
            name={a.member.name}
            photo={a.member.photo_thumbnail_url ?? null}
          />
        );
      }
      return (
        <span className="font-medium">{a.contact?.display_name ?? a.contact_id ?? "Unknown"}</span>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[status] ?? ""}`}
        >
          {STATUS_LABELS[status] ?? status}
        </span>
      );
    },
  },
  {
    accessorKey: "waiver_signed",
    header: "Waiver",
    cell: ({ row }) => (
      <span className={row.original.waiver_signed ? "text-green-600" : "text-red-600"}>
        {row.original.waiver_signed ? "Signed" : "No"}
      </span>
    ),
  },
  {
    accessorKey: "registration_method",
    header: "Method",
    cell: ({ row }) => {
      const method = row.original.registration_method;
      return method ? (
        <span className="text-xs">{REGISTRATION_METHOD_LABELS[method] ?? method}</span>
      ) : (
        <span className="text-xs text-muted-foreground">Manual</span>
      );
    },
  },
  {
    accessorKey: "payment_status",
    header: "Payment",
    cell: ({ row }) => {
      const ps = row.original.payment_status;
      if (!ps) return <span className="text-xs text-muted-foreground">—</span>;
      const amount = row.original.payment_amount_cents;
      return (
        <span className={`text-xs font-medium ${PAYMENT_COLORS[ps] ?? ""}`}>
          {PAYMENT_LABELS[ps] ?? ps}
          {amount != null && ps !== PaymentStatus.NotRequired && (
            <> (${(amount / 100).toFixed(2)})</>
          )}
        </span>
      );
    },
  },
  {
    accessorKey: "badger_details.tshirtSize",
    header: "Shirt",
    accessorFn: (row) => row.badger_details?.tshirtSize ?? null,
    cell: ({ row }) => {
      const size = row.original.badger_details?.tshirtSize;
      return size ? (
        <span className="text-xs">{size}</span>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      );
    },
  },
  {
    accessorKey: "badger_details.travelingBy",
    header: "Travel",
    accessorFn: (row) => row.badger_details?.travelingBy ?? null,
    cell: ({ row }) => {
      const travel = row.original.badger_details?.travelingBy;
      return travel ? (
        <span className="text-xs">{TRAVEL_LABELS[travel] ?? travel}</span>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      );
    },
  },
  {
    accessorKey: "badger_details.club",
    header: "Club",
    accessorFn: (row) => row.badger_details?.club ?? null,
    cell: ({ row }) => {
      const club = row.original.badger_details?.club;
      return club ? (
        <span className="text-xs">{club}</span>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => <SortableHeader column={column}>Registered</SortableHeader>,
    cell: ({ row }) => {
      const date = row.original.created_at;
      return date ? (
        <span className="text-xs text-muted-foreground">{new Date(date).toLocaleDateString()}</span>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      );
    },
  },
  {
    id: "history",
    header: "",
    cell: ({ row, table }) => {
      const meta = table.options.meta as
        | { onViewHistory?: (id: string, name: string) => void }
        | undefined;
      const name = row.original.member?.name ?? row.original.contact?.display_name ?? "Unknown";
      return (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2"
          onClick={() => meta?.onViewHistory?.(row.original.id, name)}
        >
          <Clock className="size-3.5" />
        </Button>
      );
    },
  },
];

// --- Data Table ---

function AttendeesDataTable({
  data,
  onViewHistory,
}: {
  data: EventAttendeeAdmin[];
  onViewHistory: (rsvpId: string, name: string) => void;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const name = (
        row.original.member?.name ??
        row.original.contact?.display_name ??
        ""
      ).toLowerCase();
      return name.includes(filterValue.toLowerCase());
    },
    state: { sorting, globalFilter },
    meta: { onViewHistory },
  });

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="pl-9 w-64"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No attendees.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">
        {table.getFilteredRowModel().rows.length} attendee(s)
      </p>
    </div>
  );
}

// --- History Dialog ---

function HistoryDialog({
  rsvpId,
  name,
  open,
  onOpenChange,
}: {
  rsvpId: string;
  name: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: logs, isLoading } = trpc.admin.rsvps.getLogs.useQuery(
    { rsvpId },
    { enabled: open },
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>RSVP History — {name}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Loading...</p>
        ) : logs && logs.length > 0 ? (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 text-sm">
                <span className="text-xs text-muted-foreground whitespace-nowrap pt-0.5">
                  {new Date(log.createdAt).toLocaleDateString()}{" "}
                  {new Date(log.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <div>
                  <span className="font-medium">
                    {LOG_CODE_LABELS[log.messageCode] ?? log.messageCode}
                  </span>
                  {log.message && <p className="text-xs text-muted-foreground">{log.message}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-4 text-center">No history available.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

// --- Page ---

export function EventAttendeesPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [historyTarget, setHistoryTarget] = useState<{ rsvpId: string; name: string } | null>(null);

  const { data: eventData } = trpc.admin.events.get.useQuery({ id: id! }, { enabled: !!id });
  const { data: attendees, isLoading } = trpc.admin.events.getAttendees.useQuery(
    { eventId: id! },
    { enabled: !!id },
  );

  const allAttendees = attendees ?? [];
  const contactAttendees = allAttendees.filter((a) => !a.is_member);
  const memberAttendees = allAttendees.filter((a) => a.is_member);

  const handleViewHistory = (rsvpId: string, name: string) => {
    setHistoryTarget({ rsvpId, name });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/events/${id}`)}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Attendees</h1>
          {eventData && <p className="text-sm text-muted-foreground">{eventData.name}</p>}
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground py-6 text-center">Loading attendees...</p>
      ) : (
        <div className="space-y-8">
          {/* Members Section */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Users className="size-5" />
              Club Members
              <span className="text-sm font-normal text-muted-foreground">
                ({memberAttendees.length})
              </span>
            </h2>
            <AttendeesDataTable data={memberAttendees} onViewHistory={handleViewHistory} />
          </section>

          {/* Contacts Section */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              Contacts
              <span className="text-sm font-normal text-muted-foreground">
                ({contactAttendees.length})
              </span>
            </h2>
            <AttendeesDataTable data={contactAttendees} onViewHistory={handleViewHistory} />
          </section>
        </div>
      )}

      {historyTarget && (
        <HistoryDialog
          rsvpId={historyTarget.rsvpId}
          name={historyTarget.name}
          open
          onOpenChange={(open) => {
            if (!open) setHistoryTarget(null);
          }}
        />
      )}
    </div>
  );
}
