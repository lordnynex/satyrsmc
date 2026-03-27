import { useState, useEffect } from "react";
import { trpc } from "@/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RsvpAdminOutput } from "@satyrsmc/shared/dto/admin/rsvp";
import { AttendeeStatus, PaymentStatus } from "@satyrsmc/shared/lib/enums";
import {
  ClipboardCheck,
  Search,
  CheckCircle,
  XCircle,
  DollarSign,
  AlertTriangle,
} from "lucide-react";

const STATUS_LABELS: Record<AttendeeStatus, string> = {
  [AttendeeStatus.Pending]: "Pending Review",
  [AttendeeStatus.Yes]: "Registered",
  [AttendeeStatus.No]: "Cancelled",
};

const STATUS_COLORS: Record<AttendeeStatus, string> = {
  [AttendeeStatus.Pending]: "bg-yellow-100 text-yellow-800",
  [AttendeeStatus.Yes]: "bg-green-100 text-green-800",
  [AttendeeStatus.No]: "bg-red-100 text-red-800",
};

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PaymentStatus.NotRequired]: "N/A",
  [PaymentStatus.Pending]: "Pending",
  [PaymentStatus.Confirmed]: "Paid",
  [PaymentStatus.RefundRequested]: "Refund Requested",
  [PaymentStatus.Refunded]: "Refunded",
};

const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  [PaymentStatus.NotRequired]: "text-muted-foreground",
  [PaymentStatus.Pending]: "text-yellow-600",
  [PaymentStatus.Confirmed]: "text-green-600",
  [PaymentStatus.RefundRequested]: "text-orange-600",
  [PaymentStatus.Refunded]: "text-muted-foreground",
};

type Props = {
  eventId: string;
  onRefresh?: () => void;
};

export function EventRegistrationsCard({ eventId, onRefresh }: Props) {
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: rsvps, isLoading } = trpc.admin.rsvps.listActionRequired.useQuery({ eventId });

  const confirmPaymentMutation = trpc.admin.rsvps.confirmPayment.useMutation({
    onSuccess: invalidate,
  });

  const confirmBulkPaymentMutation = trpc.admin.rsvps.confirmBulkPayment.useMutation({
    onSuccess: () => {
      setSelectedIds(new Set());
      invalidate();
    },
  });

  const adminCancelMutation = trpc.admin.rsvps.adminCancel.useMutation({
    onSuccess: invalidate,
  });

  const processRefundMutation = trpc.admin.rsvps.processRefund.useMutation({
    onSuccess: invalidate,
  });

  function invalidate() {
    utils.admin.rsvps.listActionRequired.invalidate({ eventId });
    utils.admin.rsvps.listByEvent.invalidate({ eventId });
    utils.admin.rsvps.listPendingReview.invalidate({ eventId });
    onRefresh?.();
  }

  const allRsvps = rsvps ?? [];

  const filtered = allRsvps.filter((r) => {
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      const name = (r.displayName ?? "").toLowerCase();
      if (!name.includes(q)) return false;
    }
    return true;
  });

  const pendingReviewCount = allRsvps.filter((r) => r.status === AttendeeStatus.Pending).length;
  const pendingPaymentCount = allRsvps.filter(
    (r) => r.paymentStatus === PaymentStatus.Pending && r.status !== AttendeeStatus.Pending,
  ).length;
  const refundRequestedCount = allRsvps.filter(
    (r) => r.paymentStatus === PaymentStatus.RefundRequested,
  ).length;

  const BULK_PAYMENT_LIMIT = 20;

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < BULK_PAYMENT_LIMIT) {
        next.add(id);
      }
      return next;
    });
  };

  const handleBulkConfirmPayment = () => {
    if (selectedIds.size === 0) return;
    confirmBulkPaymentMutation.mutate({ rsvpIds: [...selectedIds] });
  };

  return (
    <Card id="registrations" className="scroll-mt-28">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck className="size-5" />
          Pending Registrations
          {allRsvps.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">({allRsvps.length})</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary badges */}
        {(pendingReviewCount > 0 || pendingPaymentCount > 0 || refundRequestedCount > 0) && (
          <div className="flex flex-wrap gap-2">
            {pendingReviewCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-50 border border-yellow-200 px-3 py-1 text-xs font-medium text-yellow-800">
                <AlertTriangle className="size-3" />
                {pendingReviewCount} pending review
              </span>
            )}
            {pendingPaymentCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-medium text-blue-800">
                <DollarSign className="size-3" />
                {pendingPaymentCount} payment pending
              </span>
            )}
            {refundRequestedCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 border border-orange-200 px-3 py-1 text-xs font-medium text-orange-800">
                <AlertTriangle className="size-3" />
                {refundRequestedCount} refund requested
              </span>
            )}
          </div>
        )}

        {/* Search */}
        {allRsvps.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
        )}

        {/* Bulk actions */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-2">
            <span className="text-sm font-medium">{selectedIds.size} selected</span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkConfirmPayment}
              disabled={confirmBulkPaymentMutation.isPending}
            >
              <CheckCircle className="size-3.5" />
              Confirm Payment
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
              Clear
            </Button>
          </div>
        )}

        {/* List */}
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Loading registrations...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No registrations need attention.
          </p>
        ) : (
          <div className="space-y-2">
            {filtered.map((rsvp) => (
              <RegistrationRow
                key={rsvp.id}
                rsvp={rsvp}
                isSelected={selectedIds.has(rsvp.id)}
                selectionAtLimit={selectedIds.size >= BULK_PAYMENT_LIMIT}
                onToggleSelect={() => toggleSelected(rsvp.id)}
                onConfirmPayment={() => {
                  confirmPaymentMutation.mutate({ rsvpId: rsvp.id });
                }}
                onAdminCancel={() => {
                  if (confirm("Cancel this registration?")) {
                    adminCancelMutation.mutate({ rsvpId: rsvp.id });
                  }
                }}
                onProcessRefund={() => {
                  const note = prompt("Refund note (optional):");
                  processRefundMutation.mutate({ rsvpId: rsvp.id, note: note ?? undefined });
                }}
                isPending={
                  confirmPaymentMutation.isPending ||
                  adminCancelMutation.isPending ||
                  processRefundMutation.isPending
                }
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type RegistrationRowProps = {
  rsvp: RsvpAdminOutput;
  isSelected: boolean;
  selectionAtLimit: boolean;
  onToggleSelect: () => void;
  onConfirmPayment: () => void;
  onAdminCancel: () => void;
  onProcessRefund: () => void;
  isPending: boolean;
};

function RegistrationRow({
  rsvp,
  isSelected,
  selectionAtLimit,
  onToggleSelect,
  onConfirmPayment,
  onAdminCancel,
  onProcessRefund,
  isPending,
}: RegistrationRowProps) {
  const isCancelled = rsvp.status === AttendeeStatus.No;
  const displayName = rsvp.displayName ?? rsvp.contactDisplayName ?? "Unknown";

  return (
    <div className={`rounded-lg border p-4 space-y-3 ${isCancelled ? "opacity-60" : ""}`}>
      <div className="flex items-center gap-3">
        {/* Checkbox for bulk selection (only for pending payment items) */}
        {rsvp.paymentStatus === PaymentStatus.Pending && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            disabled={!isSelected && selectionAtLimit}
            className="shrink-0"
          />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium truncate">{displayName}</p>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[rsvp.status]}`}
            >
              {STATUS_LABELS[rsvp.status]}
            </span>
            <span className={`text-xs font-medium ${PAYMENT_STATUS_COLORS[rsvp.paymentStatus]}`}>
              {PAYMENT_STATUS_LABELS[rsvp.paymentStatus]}
              {rsvp.paymentAmountCents != null &&
                rsvp.paymentStatus !== PaymentStatus.NotRequired && (
                  <> (${(rsvp.paymentAmountCents / 100).toFixed(2)})</>
                )}
            </span>
          </div>
          {rsvp.badgerDetails && (
            <p className="text-xs text-muted-foreground">
              Shirt: {rsvp.badgerDetails.tshirtSize} &middot; Travel:{" "}
              {rsvp.badgerDetails.travelingBy}
              {rsvp.badgerDetails.club && <> &middot; Club: {rsvp.badgerDetails.club}</>}
            </p>
          )}
          {rsvp.paymentMethod && (
            <p className="text-xs text-muted-foreground">Payment: {rsvp.paymentMethod}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {rsvp.paymentStatus === PaymentStatus.Pending && (
            <Button size="sm" variant="outline" onClick={onConfirmPayment} disabled={isPending}>
              <DollarSign className="size-3.5" />
              Confirm Pay
            </Button>
          )}
          {rsvp.paymentStatus === PaymentStatus.RefundRequested && (
            <Button size="sm" variant="outline" onClick={onProcessRefund} disabled={isPending}>
              Refund
            </Button>
          )}
          {!isCancelled && (
            <Button size="sm" variant="ghost" onClick={onAdminCancel} disabled={isPending}>
              <XCircle className="size-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
