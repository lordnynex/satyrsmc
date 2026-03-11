import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { PackingItemRow } from "./PackingItemRow";
import type { EventPackingCategory, EventPackingItem } from "@satyrsmc/shared/client";

interface PackingCategorySectionProps {
  category: EventPackingCategory;
  items: EventPackingItem[];
  onToggleLoaded: (itemId: string, loaded: boolean) => void;
  onEditItem: (item: EventPackingItem) => void;
  onDeleteItem: (itemId: string) => void;
  onAddItemInCategory: (categoryId: string) => void;
}

export function PackingCategorySection({
  category,
  items,
  onToggleLoaded,
  onEditItem,
  onDeleteItem,
  onAddItemInCategory,
}: PackingCategorySectionProps) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2">
        <h4 className="text-xs font-medium text-muted-foreground">{category.name}</h4>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={() => onAddItemInCategory(category.id)}
          aria-label={`Add item to ${category.name}`}
        >
          <Plus className="size-3" />
        </Button>
      </div>
      <ul className="space-y-0.5">
        {items.map((item) => (
          <PackingItemRow
            key={item.id}
            item={item}
            onToggleLoaded={(loaded) => onToggleLoaded(item.id, loaded)}
            onEdit={() => onEditItem(item)}
            onDelete={() => onDeleteItem(item.id)}
          />
        ))}
      </ul>
    </div>
  );
}
