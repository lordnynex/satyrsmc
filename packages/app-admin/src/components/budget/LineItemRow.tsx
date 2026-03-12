import { useState, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Trash2, Check } from "lucide-react";
import type { LineItem } from "@satyrsmc/shared/client";

interface LineItemRowProps {
  item: LineItem;
  categories: string[];
  onUpdate: (id: string, updates: Partial<LineItem>) => Promise<void>;
  onDelete: (id: string) => void;
  onAddCategory: (name: string) => void;
}

export function LineItemRow({
  item,
  categories,
  onUpdate,
  onDelete,
  onAddCategory,
}: LineItemRowProps) {
  const total = item.unitCost * item.quantity;
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showSaved = useCallback(() => {
    setSavedAt(Date.now());
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      setSavedAt(null);
      saveTimeoutRef.current = null;
    }, 2000);
  }, []);

  const handleUpdate = useCallback(
    async (id: string, updates: Partial<LineItem>) => {
      await onUpdate(id, updates);
      showSaved();
    },
    [onUpdate, showSaved],
  );

  return (
    <tr className="border-b border-border transition-colors hover:bg-muted/30">
      <td className="p-2">
        <Input
          value={item.name}
          onChange={(e) => handleUpdate(item.id, { name: e.target.value })}
          placeholder="Item name"
          className="h-8 text-sm"
        />
      </td>
      <td className="p-2 w-24">
        <Input
          type="number"
          value={item.unitCost}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!Number.isNaN(v)) handleUpdate(item.id, { unitCost: v });
          }}
          min={0}
          step={0.01}
          className="h-8 text-sm"
        />
      </td>
      <td className="p-2 w-20">
        <Input
          type="number"
          value={item.quantity}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!Number.isNaN(v) && v >= 0) handleUpdate(item.id, { quantity: v });
          }}
          min={0}
          step={1}
          className="h-8 text-sm"
        />
      </td>
      <td className="p-2 text-right font-medium tabular-nums">
        ${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
      </td>
      <td className="p-2 min-w-[120px]">
        <Select
          value={categories.includes(item.category) ? item.category : categories[0]}
          onValueChange={(v) => {
            if (v === "__add__") {
              const name = window.prompt("New category name:");
              if (name?.trim()) {
                onAddCategory(name.trim());
                handleUpdate(item.id, { category: name.trim() });
              }
            } else {
              handleUpdate(item.id, { category: v });
            }
          }}
        >
          <SelectTrigger className="h-8 text-sm" size="sm">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
            <SelectItem value="__add__">+ Add category</SelectItem>
          </SelectContent>
        </Select>
      </td>
      <td className="p-2 max-w-[160px]">
        <Input
          value={item.comments ?? ""}
          onChange={(e) => handleUpdate(item.id, { comments: e.target.value })}
          placeholder="Comments"
          className="h-8 text-sm"
        />
      </td>
      <td className="p-2 min-w-[72px]">
        <div className="flex items-center gap-2">
          {savedAt != null && (
            <span className="flex items-center gap-1 text-xs text-green-600 animate-in fade-in duration-200">
              <Check className="size-3.5" />
              Saved
            </span>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onDelete(item.id)}
            aria-label="Delete"
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      </td>
    </tr>
  );
}
