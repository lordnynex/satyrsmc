import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ImagePlus, Trash2, Star, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ContactPhotoLightbox } from "./ContactPhotoLightbox";
import type { ContactPhoto } from "@satyrsmc/shared/client";

interface ContactPhotoCarouselProps {
  contactId: string;
  contactName: string;
  photos: ContactPhoto[];
  onAddPhoto: (file: File, setAsProfile?: boolean) => Promise<void>;
  onDeletePhoto: (photoId: string) => Promise<void>;
  onSetProfilePhoto: (photoId: string) => Promise<void>;
  disabled?: boolean;
}

export function ContactPhotoCarousel({
  contactId: _contactId,
  contactName,
  photos,
  onAddPhoto,
  onDeletePhoto,
  onSetProfilePhoto,
  disabled = false,
}: ContactPhotoCarouselProps) {
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
      await onAddPhoto(file, !hasPhotos);
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
    <div className="flex flex-col gap-3">
      {/* Main photo display */}
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
              alt={`${contactName} photo`}
              className="size-full object-cover"
            />
            {!disabled && currentPhoto.type !== "profile" && (
              <Button
                variant="secondary"
                size="sm"
                className="absolute top-2 left-2 gap-1.5 shadow-md"
                onClick={(e) => {
                  e.stopPropagation();
                  onSetProfilePhoto(currentPhoto.id);
                }}
                title="The previous main photo will remain in your gallery"
              >
                <Star className="size-4" />
                Set as main
              </Button>
            )}
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
                  {currentPhoto.type !== "profile" && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onSetProfilePhoto(currentPhoto.id);
                      }}
                      title="The previous main photo will remain in your gallery"
                    >
                      <Star className="size-4 mr-2" />
                      Set as main
                    </DropdownMenuItem>
                  )}
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

      {/* Thumbnail carousel */}
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
              <img src={photo.photo_thumbnail_url} alt="" className="size-full object-cover" />
              {photo.type === "profile" && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-4 bg-black/50 flex items-center justify-center"
                  title="Profile photo"
                >
                  <Star className="size-2.5 text-amber-400 fill-amber-400" />
                </div>
              )}
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
                    {photo.type !== "profile" && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onSetProfilePhoto(photo.id);
                        }}
                        title="The previous main photo will remain in your gallery"
                      >
                        <Star className="size-4 mr-2" />
                        Set as main
                      </DropdownMenuItem>
                    )}
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

      {/* Add photo button - always visible when not disabled */}
      {!disabled && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <ImagePlus className="size-4 mr-2" />
          {uploading ? "Uploading..." : "Add photo"}
        </Button>
      )}

      {currentPhoto && (
        <ContactPhotoLightbox
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
          photoUrl={currentPhoto.photo_url}
          contactName={contactName}
        />
      )}
    </div>
  );
}
