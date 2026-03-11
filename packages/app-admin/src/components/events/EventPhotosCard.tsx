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
import type { EventPhoto } from "@satyrsmc/shared/client";

interface EventPhotosCardProps {
  eventId: string;
  eventName: string;
  photos: EventPhoto[];
  onAddPhoto: (file: File) => Promise<void>;
  onDeletePhoto: (photoId: string) => Promise<void>;
  disabled?: boolean;
}

export function EventPhotosCard({
  eventId,
  eventName,
  photos,
  onAddPhoto,
  onDeletePhoto,
  disabled = false,
}: EventPhotosCardProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentPhoto = photos[selectedIndex] ?? photos[0];
  const hasPhotos = photos.length > 0;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      await onAddPhoto(file);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (photoId: string) => {
    if (!confirm("Delete this photo?")) return;
    await onDeletePhoto(photoId);
    if (selectedIndex >= photos.length - 1 && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  return (
    <Card id="event-photos">
      <CardHeader>
        <CardTitle>Event photos</CardTitle>
        <p className="text-sm text-muted-foreground">
          Photos taken at or after the event.
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          <div
            className={`relative aspect-square w-full max-w-[280px] rounded-lg border bg-muted overflow-hidden flex items-center justify-center ${
              hasPhotos ? "cursor-pointer hover:opacity-95 transition-opacity" : ""
            }`}
            onClick={hasPhotos ? () => setLightboxOpen(true) : undefined}
            role={hasPhotos ? "button" : undefined}
            aria-label={hasPhotos ? "View full size" : undefined}
          >
            {hasPhotos ? (
              <>
                <img
                  src={currentPhoto.photo_display_url}
                  alt={`${eventName} photo`}
                  className="size-full object-cover"
                />
                {!disabled && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute top-2 right-2 size-9 rounded-full shadow-md"
                        onClick={(e) => e.stopPropagation()}
                        aria-label="Photo options"
                      >
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(currentPhoto.id);
                        }}
                      >
                        <Trash2 className="size-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <ImagePlus className="size-12" />
                <span className="text-sm">No photos yet</span>
              </div>
            )}
            {!disabled && (
              <Button
                variant="secondary"
                size="icon"
                className="absolute bottom-2 right-2 size-9 rounded-full shadow-md"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                disabled={uploading}
                aria-label="Add photo"
              >
                <ImagePlus className="size-4" />
              </Button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {photos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {photos.map((photo, idx) => (
                <div
                  key={photo.id}
                  className={`relative shrink-0 size-14 rounded-md border-2 overflow-hidden cursor-pointer transition-all ${
                    selectedIndex === idx
                      ? "border-primary ring-1 ring-primary"
                      : "border-transparent hover:border-muted-foreground/30"
                  }`}
                  onClick={() => setSelectedIndex(idx)}
                >
                  <img
                    src={photo.photo_thumbnail_url}
                    alt=""
                    className="size-full object-cover"
                  />
                  {!disabled && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-0.5 right-0.5 size-6 rounded bg-black/50 text-white hover:bg-black/70 opacity-0 hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="size-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(photo.id);
                          }}
                        >
                          <Trash2 className="size-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              ))}
            </div>
          )}

          {!disabled && (
            <Button
              variant="outline"
              size="sm"
              className="w-full max-w-[280px]"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <ImagePlus className="size-4 mr-2" />
              {uploading ? "Uploading..." : "Add photo"}
            </Button>
          )}

          {currentPhoto && lightboxOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
              onClick={() => setLightboxOpen(false)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Escape" && setLightboxOpen(false)}
            >
              <img
                src={currentPhoto.photo_url}
                alt={`${eventName} photo`}
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
