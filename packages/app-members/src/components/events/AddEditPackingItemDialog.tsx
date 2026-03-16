import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EventPackingCategory, EventPackingItem } from "@satyrsmc/shared/client";

interface AddEditPackingItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: EventPackingCategory[];
  item?: EventPackingItem | null;
  initialCategoryId?: string;
  onSubmit: (payload: {
    category_id: string;
    name: string;
    quantity?: number;
    note?: string;
  }) => Promise<void>;
}

export function AddEditPackingItemDialog({
  open,
  onOpenChange,
  categories,
  item,
  initialCategoryId,
  onSubmit,
}: AddEditPackingItemDialogProps) {
  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState<string>("");
  const [note, setNote] = useState("");

  const isEditing = !!item;

  useEffect(() => {
    if (open) {
      if (item) {
        setCategoryId(item.category_id);
        setName(item.name);
        setQuantity(item.quantity != null ? String(item.quantity) : "");
        setNote(item.note ?? "");
      } else {
        setCategoryId(initialCategoryId ?? categories[0]?.id ?? "");
        setName("");
        setQuantity("");
        setNote("");
      }
    }
  }, [open, item, categories, initialCategoryId]);

  const handleSubmit = async () => {
    if (!name.trim() || !categoryId) return;
    await onSubmit({
      category_id: categoryId,
      name: name.trim(),
      quantity: quantity ? parseInt(quantity, 10) : undefined,
      note: note.trim() || undefined,
    });
    setName("");
    setQuantity("");
    setNote("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Packing Item" : "Add Packing Item"}</DialogTitle>
          <CardDescription>
            {isEditing ? "Update the item details" : "Add an item to the load out list"}
          </CardDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Item Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Extension cords"
            />
          </div>
          <div className="space-y-2">
            <Label>Quantity (optional)</Label>
            <Input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 2"
            />
          </div>
          <div className="space-y-2">
            <Label>Note (optional)</Label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. 50ft length"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>{isEditing ? "Save" : "Add"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
