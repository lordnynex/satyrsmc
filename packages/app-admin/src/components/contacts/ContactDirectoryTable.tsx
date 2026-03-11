import type { Contact } from "@satyrsmc/shared/client";
import { formatAddress, getPrimaryAddress } from "./contactUtils";
import { formatPhoneNumber } from "@/lib/phone";

export type ContactTableColumn =
  | "checkbox"
  | "name"
  | "phone"
  | "address"
  | "email"
  | "tags"
  | "status"
  | "actions";

export interface ContactTableRow {
  contact: Contact;
  canRemoveFromList?: boolean;
}

export interface ContactDirectoryTableProps {
  rows: ContactTableRow[];
  columns: ContactTableColumn[];
  selectable?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onToggleSelectAll?: () => void;
  onRowClick?: (contact: Contact) => void;
  renderRowActions?: (row: ContactTableRow) => React.ReactNode;
}

export function ContactDirectoryTable({
  rows,
  columns,
  selectable = false,
  selectedIds = new Set(),
  onToggleSelect,
  onToggleSelectAll,
  onRowClick,
  renderRowActions,
}: ContactDirectoryTableProps) {
  const hasColumn = (col: ContactTableColumn) => columns.includes(col);
  const contacts = rows.map((r) => r.contact);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm table-fixed">
        <thead>
          <tr className="border-b">
            {hasColumn("checkbox") && (
              <th className="w-10 px-2 py-2 text-left">
                {selectable && (
                  <input
                    type="checkbox"
                    checked={selectedIds.size === contacts.length && contacts.length > 0}
                    onChange={onToggleSelectAll}
                    className="rounded"
                  />
                )}
              </th>
            )}
            {hasColumn("name") && (
              <th className="px-2 py-2 text-left font-medium">Name</th>
            )}
            {hasColumn("phone") && (
              <th className="px-2 py-2 text-left font-medium">Phone</th>
            )}
            {hasColumn("address") && (
              <th className="px-2 py-2 text-left font-medium w-[200px]">Address</th>
            )}
            {hasColumn("email") && (
              <th className="px-2 py-2 text-left font-medium">Email</th>
            )}
            {hasColumn("tags") && (
              <th className="px-2 py-2 text-left font-medium">Tags</th>
            )}
            {hasColumn("status") && (
              <th className="px-2 py-2 text-left font-medium">Status</th>
            )}
            {hasColumn("actions") && (
              <th className="w-12 px-2 py-2 text-left font-medium" />
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const c = row.contact;
            return (
              <tr
                key={c.id}
                className={`border-b ${onRowClick ? "hover:bg-muted/50 cursor-pointer" : ""}`}
                onClick={onRowClick ? () => onRowClick(c) : undefined}
              >
                {hasColumn("checkbox") && (
                  <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                    {selectable && (
                      <input
                        type="checkbox"
                        checked={selectedIds.has(c.id)}
                        onChange={() => onToggleSelect?.(c.id)}
                        className="rounded"
                      />
                    )}
                  </td>
                )}
                {hasColumn("name") && (
                  <td className="px-2 py-2 font-medium">{c.display_name}</td>
                )}
                {hasColumn("phone") && (
                  <td className="px-2 py-2 text-muted-foreground">
                    {formatPhoneNumber(
                      c.phones?.find((p) => p.is_primary)?.phone ?? c.phones?.[0]?.phone ?? ""
                    ) || "—"}
                  </td>
                )}
                {hasColumn("address") && (
                  <td
                    className="px-2 py-2 text-muted-foreground overflow-hidden"
                    title={formatAddress(getPrimaryAddress(c)) || undefined}
                  >
                    <span className="block truncate">
                      {formatAddress(getPrimaryAddress(c)) || "—"}
                    </span>
                  </td>
                )}
                {hasColumn("email") && (
                  <td className="px-2 py-2 text-muted-foreground">
                    {c.emails?.[0]?.email ?? "—"}
                  </td>
                )}
                {hasColumn("tags") && (
                  <td className="px-2 py-2">
                    <div className="flex flex-wrap gap-1">
                      {(c.tags ?? []).slice(0, 3).map((t) => (
                        <span
                          key={t.id}
                          className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-xs"
                        >
                          {t.name}
                        </span>
                      ))}
                      {(c.tags ?? []).length > 3 && (
                        <span className="text-muted-foreground text-xs">
                          +{(c.tags ?? []).length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                )}
                {hasColumn("status") && (
                  <td className="px-2 py-2">
                    <span
                      className={`inline-flex rounded px-1.5 py-0.5 text-xs ${
                        c.status === "active"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-muted"
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                )}
                {hasColumn("actions") && (
                  <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                    {renderRowActions?.(row)}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
