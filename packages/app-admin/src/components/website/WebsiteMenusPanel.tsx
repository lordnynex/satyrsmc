import { useState, useEffect } from "react";
import { useWebsiteMenusOptional, useWebsiteUpdateMenu } from "@/queries/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { List } from "lucide-react";

const MENU_KEYS = ["main", "footer"] as const;

export function WebsiteMenusPanel() {
  const { data: menus = {}, isLoading } = useWebsiteMenusOptional();
  const updateMutation = useWebsiteUpdateMenu();
  const [selectedKey, setSelectedKey] = useState<string>("main");
  const [items, setItems] = useState<
    Array<{ id: string; label: string; url: string; internal_ref: string }>
  >([]);

  useEffect(() => {
    const list = menus[selectedKey] ?? [];
    setItems(
      list.map((it, i) => ({
        id: `server-${i}`,
        label: it.label,
        url: it.url ?? "",
        internal_ref: it.internal_ref ?? "",
      })),
    );
  }, [selectedKey, menus]);

  function addItem() {
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), label: "", url: "", internal_ref: "" },
    ]);
  }

  function removeItem(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  function setItem(i: number, field: "label" | "url" | "internal_ref", value: string) {
    setItems((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  }

  function handleSave() {
    updateMutation.mutate({
      key: selectedKey,
      items: items.map((it, i) => ({
        label: it.label.trim() || "Item",
        url: it.url.trim() || null,
        internal_ref: it.internal_ref.trim() || null,
        sort_order: i,
      })),
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <List className="size-5" />
            Menus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Edit navigation menus for the public site (e.g. main header, footer). Add, reorder, and
            link menu items to pages (internal_ref = page slug) or external URLs.
          </p>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <>
              <div className="flex gap-2 mb-4">
                {MENU_KEYS.map((key) => (
                  <Button
                    key={key}
                    variant={selectedKey === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedKey(key)}
                  >
                    {key}
                  </Button>
                ))}
              </div>
              <div className="space-y-3">
                {items.map((item, i) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center gap-2 rounded-md border p-2"
                  >
                    <Input
                      placeholder="Label"
                      value={item.label}
                      onChange={(e) => setItem(i, "label", e.target.value)}
                      className="w-32"
                    />
                    <Input
                      placeholder="URL (external)"
                      value={item.url}
                      onChange={(e) => setItem(i, "url", e.target.value)}
                      className="flex-1 min-w-[120px]"
                    />
                    <Input
                      placeholder="Page slug (internal)"
                      value={item.internal_ref}
                      onChange={(e) => setItem(i, "internal_ref", e.target.value)}
                      className="w-36"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(i)}
                      aria-label="Remove"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  Add item
                </Button>
              </div>
              <Button className="mt-4" onClick={handleSave} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving…" : "Save menu"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
