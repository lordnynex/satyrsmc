import { useRef, useEffect, useState } from "react";
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
import { useCreateMember } from "@/queries/hooks";
import { MEMBER_POSITIONS } from "@satyrsmc/shared/client";
import { MONTHS } from "./memberUtils";
import { fileToBase64 } from "./memberUtils";

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void | Promise<void>;
}

export function AddMemberDialog({ open, onOpenChange, onSuccess }: AddMemberDialogProps) {
  const createMemberMutation = useCreateMember();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [birthday, setBirthday] = useState("");
  const [memberSinceMonth, setMemberSinceMonth] = useState<string>("");
  const [memberSinceYear, setMemberSinceYear] = useState<string>("");
  const [isBaby, setIsBaby] = useState(false);
  const [position, setPosition] = useState<string>("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setBirthday("");
    setMemberSinceMonth("");
    setMemberSinceYear("");
    setIsBaby(false);
    setPosition("");
    setEmergencyName("");
    setEmergencyPhone("");
    setPhoto(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [open]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await fileToBase64(file);
      setPhoto(base64);
    } catch {
      // ignore
    }
  };

  const handleAdd = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const memberSince =
        memberSinceMonth && memberSinceYear
          ? `${memberSinceYear}-${memberSinceMonth.padStart(2, "0")}`
          : undefined;
      await createMemberMutation.mutateAsync({
        name: name.trim(),
        phone_number: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        birthday: birthday || undefined,
        member_since: memberSince,
        is_baby: isBaby,
        position: position || undefined,
        emergency_contact_name: emergencyName.trim() || undefined,
        emergency_contact_phone: emergencyPhone.trim() || undefined,
        photo: photo || undefined,
      });
      onOpenChange(false);
      await onSuccess();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Member</DialogTitle>
          <CardDescription>Create a new club member profile</CardDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
          </div>
          <div className="space-y-2">
            <Label>Phone Number</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="member@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street, city, state, zip"
            />
          </div>
          <div className="space-y-2">
            <Label>Birthday</Label>
            <Input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Member Since</Label>
            <div className="flex gap-2">
              <Select
                value={memberSinceMonth || "none"}
                onValueChange={(v) => setMemberSinceMonth(v === "none" ? "" : v)}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Month</SelectItem>
                  {MONTHS.map((mo, i) => (
                    <SelectItem key={mo} value={String(i + 1)}>
                      {mo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={memberSinceYear || "none"}
                onValueChange={(v) => setMemberSinceYear(v === "none" ? "" : v)}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Year</SelectItem>
                  {Array.from(
                    { length: new Date().getFullYear() - 1985 + 1 },
                    (_, i) => new Date().getFullYear() - i,
                  ).map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="add-is-baby"
              checked={isBaby}
              onChange={(e) => setIsBaby(e.target.checked)}
              className="size-4 rounded border-input"
            />
            <Label htmlFor="add-is-baby" className="cursor-pointer font-normal">
              Baby
            </Label>
          </div>
          <div className="space-y-2">
            <Label>Position</Label>
            <Select
              value={position || "none"}
              onValueChange={(v) => setPosition(v === "none" ? "" : v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {MEMBER_POSITIONS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Emergency Contact Name</Label>
            <Input
              value={emergencyName}
              onChange={(e) => setEmergencyName(e.target.value)}
              placeholder="Contact name"
            />
          </div>
          <div className="space-y-2">
            <Label>Emergency Contact Phone</Label>
            <Input
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(e.target.value)}
              placeholder="(555) 987-6543"
            />
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
            {photo && (
              <div className="mt-2">
                <img src={photo} alt="Preview" className="size-20 rounded-lg object-cover border" />
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!name.trim() || saving}>
            {saving ? "Adding..." : "Add Member"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
