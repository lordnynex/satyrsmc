import { Button } from "@/components/ui/button";
import { Check, Pencil, Trash2 } from "lucide-react";
import type { EventPackingItem } from "@satyrsmc/shared/client";

interface PackingItemRowProps {
  item: EventPackingItem;
  onToggleLoaded: (loaded: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function PackingItemRow({ item, onToggleLoaded, onEdit, onDelete }: PackingItemRowProps) {
  const loaded = item.loaded ?? false;

  return (
    <li className="flex items-center justify-between gap-2 rounded border px-2 py-1.5 pl-6 text-sm transition-colors hover:bg-muted/50">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <button
          type="button"
          onClick={() => onToggleLoaded(!loaded)}
          className="flex size-4 shrink-0 items-center justify-center rounded border border-muted-foreground/50 transition-colors hover:border-muted-foreground"
          aria-label={loaded ? "Mark not loaded" : "Mark loaded"}
        >
          {loaded && <Check className="size-2.5" />}
        </button>
        <div className="min-w-0 flex-1">
          <span className={loaded ? "line-through text-muted-foreground" : ""}>
            {item.name}
            {item.quantity != null && item.quantity > 0 && (
              <span className="ml-1.5 text-muted-foreground">×{item.quantity}</span>
            )}
          </span>
          {item.note && (
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{item.note}</p>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          onClick={onEdit}
          aria-label="Edit item"
        >
          <Pencil className="size-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
          onClick={onDelete}
          aria-label="Delete item"
        >
          <Trash2 className="size-3" />
        </Button>
      </div>
    </li>
  );
}
