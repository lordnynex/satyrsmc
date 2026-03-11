import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ImagePlus, Trash2, MoreVertical } from "lucide-react";
import type { EventAsset } from "@satyrsmc/shared/client";

interface RideAssetsCardProps {
  eventId: string;
  eventName: string;
  assets: EventAsset[];
  onAdd: (file: File) => Promise<void>;
  onDelete: (assetId: string) => Promise<void>;
}

export function RideAssetsCard({
  eventId,
  eventName,
  assets,
  onAdd,
  onDelete,
}: RideAssetsCardProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentAsset = assets[selectedIndex] ?? assets[0];
  const hasAssets = assets.length > 0;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      await onAdd(file);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (assetId: string) => {
    if (!confirm("Delete this flyer?")) return;
    await onDelete(assetId);
    if (selectedIndex >= assets.length - 1 && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  return (
    <Card id="ride-assets">
      <CardHeader>
        <CardTitle>Flyers & assets</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Promotional images and digital flyers for the ride.
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          <div
            className={`relative aspect-[3/4] w-full max-w-[200px] rounded-lg border bg-muted overflow-hidden flex items-center justify-center ${
              hasAssets ? "cursor-pointer hover:opacity-95 transition-opacity" : ""
            }`}
            onClick={hasAssets ? () => setLightboxOpen(true) : undefined}
            role={hasAssets ? "button" : undefined}
          >
            {hasAssets ? (
              <>
                <img
                  src={currentAsset.photo_display_url}
                  alt={`${eventName} flyer`}
                  className="size-full object-cover"
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute top-2 right-2 size-9 rounded-full shadow-md"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(currentAsset.id);
                      }}
                    >
                      <Trash2 className="size-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <ImagePlus className="size-12" />
                <span className="text-sm">No flyers yet</span>
              </div>
            )}
            <Button
              variant="secondary"
              size="icon"
              className="absolute bottom-2 right-2 size-9 rounded-full shadow-md"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              disabled={uploading}
            >
              <ImagePlus className="size-4" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {assets.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {assets.map((asset, idx) => (
                <div
                  key={asset.id}
                  className={`relative shrink-0 size-14 rounded-md border-2 overflow-hidden cursor-pointer ${
                    selectedIndex === idx ? "border-primary" : "border-transparent"
                  }`}
                  onClick={() => setSelectedIndex(idx)}
                >
                  <img
                    src={asset.photo_thumbnail_url}
                    alt=""
                    className="size-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            className="w-full max-w-[200px]"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <ImagePlus className="size-4 mr-2" />
            {uploading ? "Uploading..." : "Add flyer"}
          </Button>

          {currentAsset && lightboxOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
              onClick={() => setLightboxOpen(false)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Escape" && setLightboxOpen(false)}
            >
              <img
                src={currentAsset.photo_url}
                alt={`${eventName} flyer`}
                className="max-h-full max-w-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
