import { useState, useRef, useEffect, useMemo } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, Users, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { ALL_MEMBERS_ID } from "@satyrsmc/shared/lib/constants";
import type { Member } from "@satyrsmc/shared/client";

export interface MemberSelectComboboxProps {
  /** All members to choose from */
  members: Member[];
  /** Member IDs to exclude (e.g. already assigned) */
  excludedIds?: Set<string>;
  /** Include "All Members" as an option */
  includeAllMembers?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Label for the field */
  label?: string;
  /** Called when a member is selected */
  onSelect: (memberId: string) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Optional className for the trigger/input container */
  className?: string;
}

export function MemberSelectCombobox({
  members,
  excludedIds = new Set(),
  includeAllMembers = false,
  placeholder = "Search or select a member",
  label,
  onSelect,
  disabled = false,
  className,
}: MemberSelectComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const availableMembers = useMemo(() => {
    const filtered = members.filter((m) => !excludedIds.has(m.id));
    if (includeAllMembers && !excludedIds.has(ALL_MEMBERS_ID)) {
      return [{ id: ALL_MEMBERS_ID, name: "All Members" } as Member, ...filtered];
    }
    return filtered;
  }, [members, excludedIds, includeAllMembers]);

  const filteredMembers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return availableMembers;
    return availableMembers.filter((m) => m.name.toLowerCase().includes(q));
  }, [availableMembers, query]);

  const handleSelect = (memberId: string) => {
    onSelect(memberId);
    setQuery("");
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
    }
  };

  useEffect(() => {
    if (open) {
      setQuery("");
      inputRef.current?.focus();
    }
  }, [open]);

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label>{label}</Label>}
      <Popover open={open} onOpenChange={setOpen} modal={false}>
        <PopoverTrigger asChild>
          <div className="relative flex w-full">
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className="pr-8"
            />
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 shrink-0 opacity-50" />
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div
            className="max-h-[200px] overflow-y-auto overscroll-contain p-1"
            onWheel={(e) => e.stopPropagation()}
          >
            {filteredMembers.length === 0 ? (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                {availableMembers.length === 0 ? "No members available" : "No matching members"}
              </div>
            ) : (
              filteredMembers.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={cn(
                    "flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm",
                    "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground outline-none",
                  )}
                  onClick={() => handleSelect(m.id)}
                >
                  {m.id === ALL_MEMBERS_ID ? (
                    <Users className="size-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <User className="size-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className="truncate">{m.name}</span>
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
