import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateContact } from "@/queries/hooks";
import { isValidPhoneNumber, normalizePhoneForStorage } from "@/lib/phone";
import { ContactType } from "@satyrsmc/shared/client";
import type { Contact } from "@satyrsmc/shared/client";

interface AddContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  /** When true, default the Hellenic checkbox to checked (e.g. when adding from Hellenics panel) */
  defaultHellenic?: boolean;
}

export function AddContactDialog({
  open,
  onOpenChange,
  onSuccess,
  defaultHellenic,
}: AddContactDialogProps) {
  const createContactMutation = useCreateContact();
  const [type, setType] = useState<Contact["type"]>(ContactType.Person);
  const [displayName, setDisplayName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [primaryEmail, setPrimaryEmail] = useState("");
  const [primaryPhone, setPrimaryPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [clubName, setClubName] = useState("");
  const [role, setRole] = useState("");
  const [hellenic, setHellenic] = useState(defaultHellenic ?? false);
  const [deceased, setDeceased] = useState(false);
  const [deceasedYear, setDeceasedYear] = useState("");
  const [saving, setSaving] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setHellenic(defaultHellenic ?? false);
    }
  }, [open, defaultHellenic]);

  const reset = () => {
    setType(ContactType.Person);
    setDisplayName("");
    setFirstName("");
    setLastName("");
    setOrgName("");
    setPrimaryEmail("");
    setPrimaryPhone("");
    setAddressLine1("");
    setAddressLine2("");
    setCity("");
    setState("");
    setPostalCode("");
    setClubName("");
    setRole("");
    setHellenic(defaultHellenic ?? false);
    setDeceased(false);
    setDeceasedYear("");
  };

  const handleSubmit = async () => {
    const name =
      displayName.trim() ||
      (type === "person" ? [firstName, lastName].filter(Boolean).join(" ") : orgName) ||
      "Unknown";
    if (!name) return;
    if (primaryPhone.trim() && !isValidPhoneNumber(primaryPhone)) {
      setPhoneError("Please enter a valid phone number (at least 10 digits)");
      return;
    }
    setPhoneError(null);
    setSaving(true);
    try {
      await createContactMutation.mutateAsync({
        type,
        display_name: name,
        first_name: type === "person" ? firstName.trim() || null : null,
        last_name: type === "person" ? lastName.trim() || null : null,
        organization_name:
          type === "organization" ? orgName.trim() || null : orgName.trim() || null,
        club_name: clubName.trim() || null,
        role: role.trim() || null,
        hellenic,
        deceased,
        deceased_year: deceased && deceasedYear.trim() ? parseInt(deceasedYear, 10) : null,
        emails: primaryEmail.trim()
          ? [
              {
                id: "",
                contact_id: "",
                email: primaryEmail.trim(),
                type: "other" as const,
                is_primary: true,
              },
            ]
          : [],
        phones: normalizePhoneForStorage(primaryPhone)
          ? [
              {
                id: "",
                contact_id: "",
                phone: normalizePhoneForStorage(primaryPhone),
                type: "other" as const,
                is_primary: true,
              },
            ]
          : [],
        addresses:
          addressLine1.trim() || city.trim() || postalCode.trim()
            ? [
                {
                  id: "",
                  contact_id: "",
                  address_line1: addressLine1.trim() || null,
                  address_line2: addressLine2.trim() || null,
                  city: city.trim() || null,
                  state: state.trim() || null,
                  postal_code: postalCode.trim() || null,
                  country: "US",
                  type: "home" as const,
                  is_primary_mailing: true,
                },
              ]
            : [],
      });
      reset();
      onOpenChange(false);
      onSuccess();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Contact</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as Contact["type"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="person">Person</SelectItem>
                <SelectItem value="organization">Organization</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === "person" ? (
            <>
              <div>
                <Label>Display name *</Label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Full name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>First name</Label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div>
                  <Label>Last name</Label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </div>
            </>
          ) : (
            <div>
              <Label>Organization name *</Label>
              <Input
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Company or org name"
              />
            </div>
          )}

          {type === "person" && (
            <div>
              <Label>Organization (optional)</Label>
              <Input
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Affiliation"
              />
            </div>
          )}

          <div>
            <Label>Primary email</Label>
            <Input
              type="email"
              value={primaryEmail}
              onChange={(e) => setPrimaryEmail(e.target.value)}
            />
          </div>
          <div>
            <Label>Primary phone</Label>
            <Input
              value={primaryPhone}
              onChange={(e) => {
                setPrimaryPhone(e.target.value);
                setPhoneError(null);
              }}
              placeholder="(555) 123-4567"
            />
            {phoneError && <p className="text-sm text-destructive mt-1">{phoneError}</p>}
          </div>

          <div className="space-y-2">
            <Label>Address</Label>
            <Input
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              placeholder="Street address"
            />
            <Input
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
              placeholder="Apt, suite, etc."
            />
            <div className="grid grid-cols-3 gap-2">
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
              <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="State" />
              <Input
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="ZIP"
              />
            </div>
          </div>

          <div>
            <Label>Club / affiliation</Label>
            <Input value={clubName} onChange={(e) => setClubName(e.target.value)} />
          </div>
          <div>
            <Label>Role / title</Label>
            <Input value={role} onChange={(e) => setRole(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="add-contact-hellenic"
              checked={hellenic}
              onChange={(e) => setHellenic(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="add-contact-hellenic">Hellenic</Label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="add-contact-deceased"
              checked={deceased}
              onChange={(e) => setDeceased(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="add-contact-deceased">Deceased</Label>
            {deceased && (
              <Input
                type="number"
                placeholder="Year (e.g. 2023)"
                value={deceasedYear}
                onChange={(e) => setDeceasedYear(e.target.value)}
                className="w-24"
                min={1900}
                max={2100}
              />
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving..." : "Add Contact"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
