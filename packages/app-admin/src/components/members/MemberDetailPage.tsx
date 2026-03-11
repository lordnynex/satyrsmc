import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  useMemberSuspense,
  useUpdateMember,
  useDeleteMember,
  unwrapSuspenseData,
} from "@/queries/hooks";
import type { Member } from "@satyrsmc/shared/client";
import { MemberProfileCard } from "./MemberProfileCard";
import { MemberEmergencyContactCard } from "./MemberEmergencyContactCard";
import { MemberPhotoLightbox } from "./MemberPhotoLightbox";
import { EditMemberDialog } from "./EditMemberDialog";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";

export function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  if (!id) return null;
  return <MemberDetailContent id={id} />;
}

function MemberDetailContent({ id }: { id: string }) {
  const navigate = useNavigate();
  const updateMemberMutation = useUpdateMember();
  const deleteMemberMutation = useDeleteMember();
  const member = unwrapSuspenseData(useMemberSuspense(id))! as Member;
  const [editOpen, setEditOpen] = useState(false);
  const [photoLightboxOpen, setPhotoLightboxOpen] = useState(false);

  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editBirthday, setEditBirthday] = useState("");
  const [editMemberSinceMonth, setEditMemberSinceMonth] = useState<string>("");
  const [editMemberSinceYear, setEditMemberSinceYear] = useState<string>("");
  const [editIsBaby, setEditIsBaby] = useState(false);
  const [editPosition, setEditPosition] = useState("");
  const [editEmergencyName, setEditEmergencyName] = useState("");
  const [editEmergencyPhone, setEditEmergencyPhone] = useState("");
  const [editPhoto, setEditPhoto] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [deleteDeleting, setDeleteDeleting] = useState(false);

  useEffect(() => {
    setEditName(member.name);
    setEditPhone(member.phone_number ?? "");
    setEditEmail(member.email ?? "");
    setEditAddress(member.address ?? "");
    setEditBirthday(member.birthday ?? "");
    if (member.member_since && /^\d{4}-\d{2}$/.test(member.member_since)) {
      const [, mo] = member.member_since.split("-");
      setEditMemberSinceMonth(String(parseInt(mo ?? "1", 10)));
      setEditMemberSinceYear(member.member_since.slice(0, 4));
    } else {
      setEditMemberSinceMonth("");
      setEditMemberSinceYear("");
    }
    setEditIsBaby(member.is_baby);
    setEditPosition(member.position ?? "");
    setEditEmergencyName(member.emergency_contact_name ?? "");
    setEditEmergencyPhone(member.emergency_contact_phone ?? "");
    setEditPhoto(member.photo_url ?? null);
  }, [member]);

  const handleSaveEdit = async () => {
    setEditSaving(true);
    try {
      const memberSince =
        editMemberSinceMonth && editMemberSinceYear
          ? `${editMemberSinceYear}-${editMemberSinceMonth.padStart(2, "0")}`
          : null;
      const updateBody: Record<string, unknown> = {
        name: editName.trim(),
        phone_number: editPhone.trim() || null,
        email: editEmail.trim() || null,
        address: editAddress.trim() || null,
        birthday: editBirthday || null,
        member_since: memberSince,
        is_baby: editIsBaby,
        position: editPosition || null,
        emergency_contact_name: editEmergencyName.trim() || null,
        emergency_contact_phone: editEmergencyPhone.trim() || null,
      };
      if (editPhoto === null || (editPhoto && editPhoto.startsWith("data:"))) {
        updateBody.photo = editPhoto;
      }
      await updateMemberMutation.mutateAsync({ id, body: updateBody });
      setEditOpen(false);
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete ${member.name}? This cannot be undone.`)) return;
    setDeleteDeleting(true);
    try {
      await deleteMemberMutation.mutateAsync(id);
      navigate("/members");
    } finally {
      setDeleteDeleting(false);
    }
  };

  const hasDetails =
    member.phone_number ||
    member.email ||
    member.address ||
    member.birthday ||
    member.member_since ||
    member.position ||
    member.emergency_contact_name ||
    member.emergency_contact_phone;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/members")}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1" />
        <Button variant="destructive" onClick={handleDelete} disabled={deleteDeleting}>
          <Trash2 className="size-4" />
          Delete
        </Button>
        <Button onClick={() => setEditOpen(true)}>
          <Pencil className="size-4" />
          Edit Member
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <MemberProfileCard member={member} onPhotoClick={() => setPhotoLightboxOpen(true)} />
        <MemberEmergencyContactCard member={member} />
      </div>

      {!hasDetails && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No additional details yet. Click Edit Member to add information.
          </CardContent>
        </Card>
      )}

      {member.photo_url && (
        <MemberPhotoLightbox
          open={photoLightboxOpen}
          onOpenChange={setPhotoLightboxOpen}
          photoUrl={member.photo_url}
          memberName={member.name}
        />
      )}

      <EditMemberDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        editName={editName}
        setEditName={setEditName}
        editPhone={editPhone}
        setEditPhone={setEditPhone}
        editEmail={editEmail}
        setEditEmail={setEditEmail}
        editAddress={editAddress}
        setEditAddress={setEditAddress}
        editBirthday={editBirthday}
        setEditBirthday={setEditBirthday}
        editMemberSinceMonth={editMemberSinceMonth}
        setEditMemberSinceMonth={setEditMemberSinceMonth}
        editMemberSinceYear={editMemberSinceYear}
        setEditMemberSinceYear={setEditMemberSinceYear}
        editIsBaby={editIsBaby}
        setEditIsBaby={setEditIsBaby}
        editPosition={editPosition}
        setEditPosition={setEditPosition}
        editEmergencyName={editEmergencyName}
        setEditEmergencyName={setEditEmergencyName}
        editEmergencyPhone={editEmergencyPhone}
        setEditEmergencyPhone={setEditEmergencyPhone}
        editPhoto={editPhoto}
        setEditPhoto={setEditPhoto}
        editSaving={editSaving}
        onSave={handleSaveEdit}
      />
    </div>
  );
}
