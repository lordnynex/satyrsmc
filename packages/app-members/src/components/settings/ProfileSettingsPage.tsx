import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ProfileSettingsUpdateInputSchema,
  type ProfileSettingsUpdateInput,
} from "@satyrsmc/shared/dto/member/profile";
import { trpc } from "@/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Loader2 } from "lucide-react";

export function ProfileSettingsPage() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.members.profile.getOwnSettings.useQuery();
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileSettingsUpdateInput>({
    resolver: zodResolver(ProfileSettingsUpdateInputSchema),
    values: data
      ? {
          first_name: data.first_name ?? "",
          last_name: data.last_name ?? "",
          phones: data.phones,
          addresses: data.addresses,
          emergency_contacts: data.emergency_contacts,
        }
      : undefined,
  });

  const phones = useFieldArray({ control, name: "phones" });
  const addresses = useFieldArray({ control, name: "addresses" });
  const emergencyContacts = useFieldArray({ control, name: "emergency_contacts" });

  const updateMutation = trpc.members.profile.updateOwnSettings.useMutation({
    onSuccess: () => {
      utils.members.profile.getOwnSettings.invalidate();
      utils.members.profile.get.invalidate();
      reset(undefined, { keepValues: true });
    },
  });

  const uploadPhotoMutation = trpc.members.profile.uploadPhoto.useMutation({
    onSuccess: () => {
      utils.members.profile.getOwnSettings.invalidate();
      utils.members.profile.get.invalidate();
      setPhotoPreview(null);
    },
  });

  const onSubmit = (formData: ProfileSettingsUpdateInput) => {
    updateMutation.mutate(formData);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      if (base64) {
        setPhotoPreview(reader.result as string);
        uploadPhotoMutation.mutate({ photo: base64 });
      }
    };
    reader.readAsDataURL(file);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Profile Settings</h1>

      {/* Photo */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Photo</CardTitle>
          <CardDescription>Upload or replace your profile photo.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          {(photoPreview || data?.photo_url) && (
            <img
              src={photoPreview ?? data?.photo_url ?? ""}
              alt="Profile"
              className="size-20 rounded-full object-cover"
            />
          )}
          <div>
            <Input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              disabled={uploadPhotoMutation.isPending}
              className="max-w-xs"
            />
            {uploadPhotoMutation.isPending && (
              <p className="mt-1 text-sm text-muted-foreground">Uploading...</p>
            )}
            {uploadPhotoMutation.error && (
              <p className="mt-1 text-sm text-destructive">{uploadPhotoMutation.error.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {updateMutation.error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {updateMutation.error.message}
          </div>
        )}
        {updateMutation.isSuccess && (
          <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-700">
            Profile updated successfully.
          </div>
        )}

        {/* Name */}
        <Card>
          <CardHeader>
            <CardTitle>Name</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input id="first_name" {...register("first_name")} />
              {errors.first_name && (
                <p className="text-sm text-destructive">{errors.first_name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input id="last_name" {...register("last_name")} />
              {errors.last_name && (
                <p className="text-sm text-destructive">{errors.last_name.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Birthday (read-only) */}
        {data?.birthday && (
          <Card>
            <CardHeader>
              <CardTitle>Birthday</CardTitle>
              <CardDescription>Contact an administrator to update your birthday.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                {new Date(data.birthday).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  timeZone: "UTC",
                })}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Phones */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Phone Numbers</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  phones.append({ phone: "", type: "cell", is_primary: false } as const)
                }
              >
                <Plus className="mr-1 size-4" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {phones.fields.length === 0 && (
              <p className="text-sm text-muted-foreground">No phone numbers added.</p>
            )}
            {phones.fields.map((field, index) => (
              <div key={field.id} className="flex items-end gap-2">
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`phones.${index}.phone`}>Phone</Label>
                  <Input
                    id={`phones.${index}.phone`}
                    {...register(`phones.${index}.phone`)}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div className="w-24 space-y-2">
                  <Label htmlFor={`phones.${index}.type`}>Type</Label>
                  <Input
                    id={`phones.${index}.type`}
                    {...register(`phones.${index}.type`)}
                    placeholder="cell"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => phones.remove(index)}
                  className="shrink-0"
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Addresses */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Addresses</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  addresses.append({
                    address_line1: "",
                    city: "",
                    state: "",
                    postal_code: "",
                    country: "US",
                    type: "home",
                    is_primary_mailing: true,
                  })
                }
              >
                <Plus className="mr-1 size-4" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {addresses.fields.length === 0 && (
              <p className="text-sm text-muted-foreground">No addresses added.</p>
            )}
            {addresses.fields.map((field, index) => (
              <div key={field.id} className="space-y-3 rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Address {index + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => addresses.remove(index)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`addresses.${index}.address_line1`}>Street</Label>
                  <Input
                    id={`addresses.${index}.address_line1`}
                    {...register(`addresses.${index}.address_line1`)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`addresses.${index}.address_line2`}>Street 2</Label>
                  <Input
                    id={`addresses.${index}.address_line2`}
                    {...register(`addresses.${index}.address_line2`)}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor={`addresses.${index}.city`}>City</Label>
                    <Input
                      id={`addresses.${index}.city`}
                      {...register(`addresses.${index}.city`)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`addresses.${index}.state`}>State</Label>
                    <Input
                      id={`addresses.${index}.state`}
                      {...register(`addresses.${index}.state`)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`addresses.${index}.postal_code`}>ZIP</Label>
                    <Input
                      id={`addresses.${index}.postal_code`}
                      {...register(`addresses.${index}.postal_code`)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Emergency Contacts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Emergency Contacts</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  emergencyContacts.append({ name: "", phone: "", email: null, relationship: null })
                }
              >
                <Plus className="mr-1 size-4" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {emergencyContacts.fields.length === 0 && (
              <p className="text-sm text-muted-foreground">No emergency contacts added.</p>
            )}
            {emergencyContacts.fields.map((field, index) => (
              <div key={field.id} className="space-y-3 rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Contact {index + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => emergencyContacts.remove(index)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`emergency_contacts.${index}.name`}>Name</Label>
                    <Input
                      id={`emergency_contacts.${index}.name`}
                      {...register(`emergency_contacts.${index}.name`)}
                    />
                    {errors.emergency_contacts?.[index]?.name && (
                      <p className="text-sm text-destructive">
                        {errors.emergency_contacts[index].name?.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`emergency_contacts.${index}.phone`}>Phone</Label>
                    <Input
                      id={`emergency_contacts.${index}.phone`}
                      {...register(`emergency_contacts.${index}.phone`)}
                    />
                    {errors.emergency_contacts?.[index]?.phone && (
                      <p className="text-sm text-destructive">
                        {errors.emergency_contacts[index].phone?.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`emergency_contacts.${index}.email`}>Email</Label>
                    <Input
                      id={`emergency_contacts.${index}.email`}
                      {...register(`emergency_contacts.${index}.email`)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`emergency_contacts.${index}.relationship`}>Relationship</Label>
                    <Input
                      id={`emergency_contacts.${index}.relationship`}
                      {...register(`emergency_contacts.${index}.relationship`)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting || !isDirty}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
