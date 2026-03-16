import { useState } from "react";
import { trpc } from "@/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId?: string;
  memberId?: string;
}

export function InviteUserDialog({
  open,
  onOpenChange,
  contactId,
  memberId,
}: InviteUserDialogProps) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const utils = trpc.useUtils();

  const createInvitation = trpc.admin.users.createInvitation.useMutation({
    onSuccess: () => {
      setSuccess(true);
      setError("");
      utils.admin.users.listRegistrations.invalidate();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    createInvitation.mutate({
      email,
      first_name: firstName || undefined,
      last_name: lastName || undefined,
      contact_id: contactId,
      member_id: memberId,
    });
  }

  function handleClose(val: boolean) {
    if (!val) {
      setEmail("");
      setFirstName("");
      setLastName("");
      setSuccess(false);
      setError("");
    }
    onOpenChange(val);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite User</DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Invitation sent to <strong>{email}</strong>. They will receive an email with a link to
              complete their signup.
            </p>
            <Button onClick={() => handleClose(false)}>Done</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invite-first-name">First Name</Label>
                <Input
                  id="invite-first-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-last-name">Last Name</Label>
                <Input
                  id="invite-last-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>
            {contactId && (
              <p className="text-xs text-muted-foreground">
                This invitation will be linked to the selected contact record.
              </p>
            )}
            {memberId && (
              <p className="text-xs text-muted-foreground">
                This invitation will be linked to the selected member record.
              </p>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createInvitation.isPending}>
                {createInvitation.isPending ? "Sending..." : "Send Invitation"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
