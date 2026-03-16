import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";

interface ContactPhotoLightboxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photoUrl: string;
  contactName: string;
}

export function ContactPhotoLightbox({
  open,
  onOpenChange,
  photoUrl,
  contactName,
}: ContactPhotoLightboxProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[min(90vw,800px)] p-0 border-0 bg-black/95 overflow-hidden"
        showCloseButton={false}
      >
        <div className="relative">
          <img
            src={photoUrl}
            alt={`${contactName} - full size`}
            className="max-h-[85vh] w-full object-contain"
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 text-white hover:bg-white/20 hover:text-white"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
          >
            <X className="size-5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
