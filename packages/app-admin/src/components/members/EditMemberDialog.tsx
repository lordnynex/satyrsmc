import { useRef } from "react";
import { CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { MEMBER_POSITIONS } from "@satyrsmc/shared/client";
import { MONTHS } from "./memberUtils";
import { fileToBase64 } from "./memberUtils";

interface EditMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editName: string;
  setEditName: (v: string) => void;
  editPhone: string;
  setEditPhone: (v: string) => void;
  editEmail: string;
  setEditEmail: (v: string) => void;
  editAddress: string;
  setEditAddress: (v: string) => void;
  editBirthday: string;
  setEditBirthday: (v: string) => void;
  editMemberSinceMonth: string;
  setEditMemberSinceMonth: (v: string) => void;
  editMemberSinceYear: string;
  setEditMemberSinceYear: (v: string) => void;
  editIsBaby: boolean;
  setEditIsBaby: (v: boolean) => void;
  editPosition: string;
  setEditPosition: (v: string) => void;
  editEmergencyName: string;
  setEditEmergencyName: (v: string) => void;
  editEmergencyPhone: string;
  setEditEmergencyPhone: (v: string) => void;
  editPhoto: string | null;
  setEditPhoto: (v: string | null) => void;
  editSaving: boolean;
  onSave: () => Promise<void>;
}

export function EditMemberDialog({
  open,
  onOpenChange,
  editName,
  setEditName,
  editPhone,
  setEditPhone,
  editEmail,
  setEditEmail,
  editAddress,
  setEditAddress,
  editBirthday,
  setEditBirthday,
  editMemberSinceMonth,
  setEditMemberSinceMonth,
  editMemberSinceYear,
  setEditMemberSinceYear,
  editIsBaby,
  setEditIsBaby,
  editPosition,
  setEditPosition,
  editEmergencyName,
  setEditEmergencyName,
  editEmergencyPhone,
  setEditEmergencyPhone,
  editPhoto,
  setEditPhoto,
  editSaving,
  onSave,
}: EditMemberDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    await onSave();
    onOpenChange(false);
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await fileToBase64(file);
      setEditPhoto(base64);
    } catch {
      // ignore
    }
  };

  const clearPhoto = () => {
    setEditPhoto(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Member</DialogTitle>
          <CardDescription>Update member details</CardDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Full name" />
          </div>
          <div className="space-y-2">
            <Label>Phone Number</Label>
            <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="(555) 123-4567" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="member@example.com" />
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} placeholder="Street, city, state, zip" />
          </div>
          <div className="space-y-2">
            <Label>Birthday</Label>
            <Input type="date" value={editBirthday} onChange={(e) => setEditBirthday(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Member Since</Label>
            <div className="flex gap-2">
              <Select value={editMemberSinceMonth || "none"} onValueChange={(v) => setEditMemberSinceMonth(v === "none" ? "" : v)}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Month</SelectItem>
                  {MONTHS.map((mo, i) => (
                    <SelectItem key={mo} value={String(i + 1)}>{mo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={editMemberSinceYear || "none"} onValueChange={(v) => setEditMemberSinceYear(v === "none" ? "" : v)}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Year</SelectItem>
                  {Array.from({ length: new Date().getFullYear() - 1985 + 1 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="edit-is-baby"
              checked={editIsBaby}
              onChange={(e) => setEditIsBaby(e.target.checked)}
              className="size-4 rounded border-input"
            />
            <Label htmlFor="edit-is-baby" className="cursor-pointer font-normal">Baby</Label>
          </div>
          <div className="space-y-2">
            <Label>Position</Label>
            <Select value={editPosition || "none"} onValueChange={(v) => setEditPosition(v === "none" ? "" : v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {MEMBER_POSITIONS.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Emergency Contact Name</Label>
            <Input value={editEmergencyName} onChange={(e) => setEditEmergencyName(e.target.value)} placeholder="Contact name" />
          </div>
          <div className="space-y-2">
            <Label>Emergency Contact Phone</Label>
            <Input value={editEmergencyPhone} onChange={(e) => setEditEmergencyPhone(e.target.value)} placeholder="(555) 987-6543" />
          </div>
          <div className="space-y-2">
            <Label>Photo</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground file:text-sm file:font-medium hover:file:bg-primary/90"
            />
            {editPhoto ? (
              <div className="mt-2 flex items-center gap-2">
                <img src={editPhoto} alt="Preview" className="size-20 rounded-lg object-cover border" />
                <Button variant="outline" size="sm" onClick={clearPhoto} className="text-destructive hover:text-destructive">
                  Remove Photo
                </Button>
              </div>
            ) : null}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!editName.trim() || editSaving}>
            {editSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
