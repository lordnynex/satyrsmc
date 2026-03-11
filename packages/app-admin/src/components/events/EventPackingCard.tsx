import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Package, Plus, FolderPlus } from "lucide-react";
import { PackingCategorySection } from "./PackingCategorySection";
import { AddPackingCategoryDialog } from "./AddPackingCategoryDialog";
import { AddEditPackingItemDialog } from "./AddEditPackingItemDialog";
import type { Event, EventPackingItem } from "@satyrsmc/shared/client";

interface EventPackingCardProps {
  event: Event;
  onAddCategory: (name: string) => Promise<void>;
  onAddItem: (payload: {
    category_id: string;
    name: string;
    quantity?: number;
    note?: string;
  }) => Promise<void>;
  onEditItem: (
    pid: string,
    payload: { category_id?: string; name?: string; quantity?: number; note?: string },
  ) => Promise<void>;
  onToggleLoaded: (pid: string, loaded: boolean) => Promise<void>;
  onDeleteItem: (pid: string) => Promise<void>;
}

export function EventPackingCard({
  event,
  onAddCategory,
  onAddItem,
  onEditItem,
  onToggleLoaded,
  onDeleteItem,
}: EventPackingCardProps) {
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [addEditItemOpen, setAddEditItemOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EventPackingItem | null>(null);
  const [initialCategoryId, setInitialCategoryId] = useState<string | undefined>(undefined);

  const categories = event.packingCategories ?? [];
  const items = event.packingItems ?? [];

  const itemsByCategory = categories.reduce(
    (acc, cat) => {
      acc[cat.id] = items
        .filter((i) => i.category_id === cat.id)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      return acc;
    },
    {} as Record<string, EventPackingItem[]>,
  );

  const hasCategories = categories.length > 0;
  const hasItems = items.length > 0;

  const openAddItem = (categoryId?: string) => {
    setEditingItem(null);
    setInitialCategoryId(categoryId);
    setAddEditItemOpen(true);
  };

  const openEditItem = (item: EventPackingItem) => {
    setEditingItem(item);
    setAddEditItemOpen(true);
  };

  const handleSubmitItem = async (payload: {
    category_id: string;
    name: string;
    quantity?: number;
    note?: string;
  }) => {
    if (editingItem) {
      await onEditItem(editingItem.id, payload);
    } else {
      await onAddItem(payload);
    }
    setEditingItem(null);
  };

  return (
    <>
      <Card id="packing" className="scroll-mt-28">
        <Collapsible defaultOpen className="group/collapsible">
          <CardHeader>
            <CollapsibleTrigger className="-m-4 flex w-full items-center justify-between rounded-lg p-4 text-left transition-colors hover:bg-muted/50">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="size-4" />
                  Load Out Packing List
                </CardTitle>
                <CardDescription>Items to pack, grouped by category</CardDescription>
              </div>
              <ChevronDown className="size-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-3">
              {!hasCategories ? (
                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm">
                    No categories yet. Create a category to organize your packing items.
                  </p>
                  <Button variant="outline" size="sm" onClick={() => setAddCategoryOpen(true)}>
                    <FolderPlus className="size-4" />
                    Add Category
                  </Button>
                </div>
              ) : !hasItems ? (
                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm">No packing items yet.</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setAddCategoryOpen(true)}>
                      <FolderPlus className="size-4" />
                      Add Category
                    </Button>
                    <Button variant="outline" size="sm" onClick={openAddItem}>
                      <Plus className="size-4" />
                      Add Item
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {categories.map((cat) => (
                    <PackingCategorySection
                      key={cat.id}
                      category={cat}
                      items={itemsByCategory[cat.id] ?? []}
                      onToggleLoaded={onToggleLoaded}
                      onEditItem={openEditItem}
                      onDeleteItem={onDeleteItem}
                      onAddItemInCategory={(cid) => openAddItem(cid)}
                    />
                  ))}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setAddCategoryOpen(true)}>
                      <FolderPlus className="size-4" />
                      Add Category
                    </Button>
                    <Button variant="outline" size="sm" onClick={openAddItem}>
                      <Plus className="size-4" />
                      Add Item
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      <AddPackingCategoryDialog
        open={addCategoryOpen}
        onOpenChange={setAddCategoryOpen}
        onSubmit={onAddCategory}
      />

      <AddEditPackingItemDialog
        open={addEditItemOpen}
        onOpenChange={(o) => {
          setAddEditItemOpen(o);
          if (!o) {
            setEditingItem(null);
            setInitialCategoryId(undefined);
          }
        }}
        categories={categories}
        item={editingItem}
        initialCategoryId={initialCategoryId}
        onSubmit={handleSubmitItem}
      />
    </>
  );
}
