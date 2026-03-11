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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateContact } from "@/queries/hooks";
import { isValidPhoneNumber, normalizePhoneForStorage } from "@/lib/phone";
import type { Contact } from "@satyrsmc/shared/client";

interface EditContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact | null;
  onSuccess: () => void;
}

export function EditContactDialog({ open, onOpenChange, contact, onSuccess }: EditContactDialogProps) {
  const updateContactMutation = useUpdateContact();
  const [displayName, setDisplayName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [howWeKnow, setHowWeKnow] = useState("");
  const [clubName, setClubName] = useState("");
  const [role, setRole] = useState("");
  const [okToEmail, setOkToEmail] = useState<Contact["ok_to_email"]>("unknown");
  const [okToMail, setOkToMail] = useState<Contact["ok_to_mail"]>("unknown");
  const [okToSms, setOkToSms] = useState<Contact["ok_to_sms"]>("unknown");
  const [doNotContact, setDoNotContact] = useState(false);
  const [hellenic, setHellenic] = useState(false);
  const [deceased, setDeceased] = useState(false);
  const [deceasedYear, setDeceasedYear] = useState<string>("");
  const [emails, setEmails] = useState<Array<{ email: string; type: string; is_primary: boolean }>>([]);
  const [phones, setPhones] = useState<Array<{ phone: string; type: string; is_primary: boolean }>>([]);
  const [addresses, setAddresses] = useState<
    Array<{
      address_line1: string;
      address_line2: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
      type: string;
      is_primary_mailing: boolean;
    }>
  >([]);
  const [tagNames, setTagNames] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  useEffect(() => {
    if (open) setPhoneError(null);
    if (contact && open) {
      setDisplayName(contact.display_name ?? "");
      setFirstName(contact.first_name ?? "");
      setLastName(contact.last_name ?? "");
      setOrgName(contact.organization_name ?? "");
      setHowWeKnow(contact.how_we_know_them ?? "");
      setClubName(contact.club_name ?? "");
      setRole(contact.role ?? "");
      setOkToEmail(contact.ok_to_email);
      setOkToMail(contact.ok_to_mail);
      setOkToSms(contact.ok_to_sms ?? "unknown");
      setDoNotContact(contact.do_not_contact);
      setHellenic(contact.hellenic ?? false);
      setDeceased(contact.deceased ?? false);
      setDeceasedYear(contact.deceased_year != null ? String(contact.deceased_year) : "");
      setEmails(
        (contact.emails ?? []).map((e) => ({
          email: e.email,
          type: e.type,
          is_primary: e.is_primary,
        }))
      );
      setPhones(
        (contact.phones ?? []).map((p) => ({
          phone: p.phone,
          type: p.type,
          is_primary: p.is_primary,
        }))
      );
      setAddresses(
        (contact.addresses ?? []).length > 0
          ? contact.addresses!.map((a) => ({
              address_line1: a.address_line1 ?? "",
              address_line2: a.address_line2 ?? "",
              city: a.city ?? "",
              state: a.state ?? "",
              postal_code: a.postal_code ?? "",
              country: a.country ?? "US",
              type: a.type,
              is_primary_mailing: a.is_primary_mailing,
            }))
          : [{ address_line1: "", address_line2: "", city: "", state: "", postal_code: "", country: "US", type: "home", is_primary_mailing: true }]
      );
      setTagNames((contact.tags ?? []).map((t) => t.name));
    }
  }, [contact, open]);

  const handleSubmit = async () => {
    if (!contact) return;
    const name = displayName.trim() || [firstName, lastName].filter(Boolean).join(" ") || "Unknown";
    const phonesWithDigits = phones.filter((p) => normalizePhoneForStorage(p.phone).length > 0);
    const invalidPhone = phonesWithDigits.find((p) => !isValidPhoneNumber(p.phone));
    if (invalidPhone) {
      setPhoneError("Please enter a valid phone number (at least 10 digits)");
      return;
    }
    setPhoneError(null);
    setSaving(true);
    try {
      await updateContactMutation.mutateAsync({
        id: contact.id,
        body: {
          display_name: name,
          first_name: firstName.trim() || null,
          last_name: lastName.trim() || null,
          organization_name: orgName.trim() || null,
          how_we_know_them: howWeKnow.trim() || null,
          club_name: clubName.trim() || null,
          role: role.trim() || null,
          ok_to_email: okToEmail,
          ok_to_mail: okToMail,
          ok_to_sms: okToSms,
          do_not_contact: doNotContact,
          hellenic,
          deceased,
          deceased_year: deceased && deceasedYear.trim() ? parseInt(deceasedYear, 10) : null,
          emails: emails.filter((e) => e.email.trim()).map((e) => ({
          id: "",
          contact_id: contact.id,
          email: e.email.trim(),
          type: (e.type as Contact["emails"] extends (infer E)[] ? E extends { type: infer T } ? T : never : never) ?? "other",
          is_primary: e.is_primary,
        })),
        phones: phonesWithDigits.map((p) => ({
          id: "",
          contact_id: contact.id,
          phone: normalizePhoneForStorage(p.phone),
          type: (p.type as "work" | "home" | "cell" | "other") ?? "other",
          is_primary: p.is_primary,
        })),
        addresses: addresses
          .filter((a) => a.address_line1.trim() || a.city.trim() || a.postal_code.trim())
          .map((a) => ({
            id: "",
            contact_id: contact.id,
            address_line1: a.address_line1.trim() || null,
            address_line2: a.address_line2.trim() || null,
            city: a.city.trim() || null,
            state: a.state.trim() || null,
            postal_code: a.postal_code.trim() || null,
            country: a.country || "US",
            type: (a.type as "home" | "work" | "postal" | "other") ?? "home",
            is_primary_mailing: a.is_primary_mailing,
          })),
          tags: tagNames.filter(Boolean).map((name) => ({ id: "", name })),
        },
      });
      onOpenChange(false);
      onSuccess();
    } finally {
      setSaving(false);
    }
  };

  if (!contact) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Contact</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Display name *</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
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
          <div>
            <Label>Organization</Label>
            <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} />
          </div>
          <div>
            <Label>Primary email</Label>
            <Input
              type="email"
              value={emails[0]?.email ?? ""}
              onChange={(e) =>
                setEmails((prev) => {
                  const next = [...prev];
                  if (!next[0]) next[0] = { email: "", type: "other", is_primary: true };
                  next[0].email = e.target.value;
                  return next;
                })
              }
            />
          </div>
          <div>
            <Label>Primary phone</Label>
            <Input
              value={phones[0]?.phone ?? ""}
              onChange={(e) => {
                setPhoneError(null);
                setPhones((prev) => {
                  const next = [...prev];
                  if (!next[0]) next[0] = { phone: "", type: "other", is_primary: true };
                  next[0].phone = e.target.value;
                  return next;
                });
              }}
              placeholder="(555) 123-4567"
            />
            {phoneError && <p className="text-sm text-destructive mt-1">{phoneError}</p>}
          </div>
          {addresses[0] && (
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={addresses[0].address_line1}
                onChange={(e) =>
                  setAddresses((prev) => {
                    const next = [...prev];
                    next[0] = { ...next[0]!, address_line1: e.target.value };
                    return next;
                  }
                )}
                placeholder="Street"
              />
              <Input
                value={addresses[0].address_line2}
                onChange={(e) =>
                  setAddresses((prev) => {
                    const next = [...prev];
                    next[0] = { ...next[0]!, address_line2: e.target.value };
                    return next;
                  }
                )}
                placeholder="Apt, suite"
              />
              <div className="grid grid-cols-3 gap-2">
                <Input
                  value={addresses[0].city}
                  onChange={(e) =>
                    setAddresses((prev) => {
                      const next = [...prev];
                      next[0] = { ...next[0]!, city: e.target.value };
                      return next;
                    })
                  }
                  placeholder="City"
                />
                <Input
                  value={addresses[0].state}
                  onChange={(e) =>
                    setAddresses((prev) => {
                      const next = [...prev];
                      next[0] = { ...next[0]!, state: e.target.value };
                      return next;
                    })
                  }
                  placeholder="State"
                />
                <Input
                  value={addresses[0].postal_code}
                  onChange={(e) =>
                    setAddresses((prev) => {
                      const next = [...prev];
                      next[0] = { ...next[0]!, postal_code: e.target.value };
                      return next;
                    })
                  }
                  placeholder="ZIP"
                />
              </div>
            </div>
          )}
          <div>
            <Label>Club / affiliation</Label>
            <Input value={clubName} onChange={(e) => setClubName(e.target.value)} />
          </div>
          <div>
            <Label>Role / title</Label>
            <Input value={role} onChange={(e) => setRole(e.target.value)} />
          </div>
          <div className="space-y-3">
            <Label>Consent</Label>
            <div className="space-y-2">
              <div>
                <Label className="text-muted-foreground text-sm">OK to email</Label>
                <Select value={okToEmail} onValueChange={(v) => setOkToEmail(v as Contact["ok_to_email"])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">OK to mail</Label>
                <Select value={okToMail} onValueChange={(v) => setOkToMail(v as Contact["ok_to_mail"])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">OK to SMS</Label>
                <Select value={okToSms} onValueChange={(v) => setOkToSms(v as Contact["ok_to_sms"])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="edit-contact-doNotContact"
              checked={doNotContact}
              onChange={(e) => setDoNotContact(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="edit-contact-doNotContact">Do not contact</Label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="edit-contact-hellenic"
              checked={hellenic}
              onChange={(e) => setHellenic(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="edit-contact-hellenic">Hellenic</Label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="edit-contact-deceased"
              checked={deceased}
              onChange={(e) => setDeceased(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="edit-contact-deceased">Deceased</Label>
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
          <div>
            <Label>Tags (comma-separated)</Label>
            <Input
              value={tagNames.join(", ")}
              onChange={(e) => setTagNames(e.target.value.split(",").map((s) => s.trim()).filter(Boolean) as string[])}
              placeholder="Vendor, Club, VIP"
            />
          </div>
          <div>
            <Label>How we know them</Label>
            <Input value={howWeKnow} onChange={(e) => setHowWeKnow(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
