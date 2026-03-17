import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BikeCreateInputSchema,
  type BikeCreateInput,
  type Bike,
} from "@satyrsmc/shared/dto/member/bike";
import { trpc } from "@/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Star, Loader2, Camera, X } from "lucide-react";

export function GarageSettingsPage() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.members.bikes.list.useQuery();
  const [formOpen, setFormOpen] = useState(false);
  const [editingBike, setEditingBike] = useState<Bike | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const bikes = data?.items ?? [];

  const createMutation = trpc.members.bikes.create.useMutation({
    onSuccess: () => {
      utils.members.bikes.list.invalidate();
      closeForm();
    },
  });

  const updateMutation = trpc.members.bikes.update.useMutation({
    onSuccess: () => {
      utils.members.bikes.list.invalidate();
      closeForm();
    },
  });

  const deleteMutation = trpc.members.bikes.delete.useMutation({
    onSuccess: () => {
      utils.members.bikes.list.invalidate();
      setDeleteConfirm(null);
    },
  });

  const setPrimaryMutation = trpc.members.bikes.setPrimary.useMutation({
    onSuccess: () => utils.members.bikes.list.invalidate(),
  });

  const uploadPhotoMutation = trpc.members.bikes.uploadPhoto.useMutation({
    onSuccess: () => utils.members.bikes.list.invalidate(),
  });

  const deletePhotoMutation = trpc.members.bikes.deletePhoto.useMutation({
    onSuccess: () => utils.members.bikes.list.invalidate(),
  });

  function openNew() {
    setEditingBike(null);
    setFormOpen(true);
  }

  function openEdit(bike: Bike) {
    setEditingBike(bike);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingBike(null);
  }

  function handlePhotoUpload(bikeId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      if (base64) {
        uploadPhotoMutation.mutate({ id: bikeId, photo: base64 });
      }
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Garage</h1>
        <Button onClick={openNew}>
          <Plus className="mr-1 size-4" />
          Add Bike
        </Button>
      </div>

      {bikes.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No bikes in your garage yet. Add one to get started.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {bikes.map((bike) => (
          <BikeCard
            key={bike.id}
            bike={bike}
            onEdit={() => openEdit(bike)}
            onDelete={() => setDeleteConfirm(bike.id)}
            onSetPrimary={() => setPrimaryMutation.mutate({ id: bike.id })}
            onPhotoUpload={(e) => handlePhotoUpload(bike.id, e)}
            onPhotoDelete={() => deletePhotoMutation.mutate({ id: bike.id })}
            showSetPrimary={!bike.is_primary && bikes.length > 1}
            isPhotoUploading={uploadPhotoMutation.isPending}
            isPhotoDeleting={deletePhotoMutation.isPending}
            isSettingPrimary={setPrimaryMutation.isPending}
          />
        ))}
      </div>

      {/* Add/Edit dialog */}
      <BikeFormDialog
        open={formOpen}
        onClose={closeForm}
        bike={editingBike}
        onSubmit={(data) => {
          if (editingBike) {
            updateMutation.mutate({ id: editingBike.id, ...data });
          } else {
            createMutation.mutate(data);
          }
        }}
        isPending={createMutation.isPending || updateMutation.isPending}
        error={createMutation.error?.message || updateMutation.error?.message}
      />

      {/* Delete confirm */}
      <Dialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Bike</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to remove this bike from your garage?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteConfirm && deleteMutation.mutate({ id: deleteConfirm })}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BikeCard({
  bike,
  onEdit,
  onDelete,
  onSetPrimary,
  onPhotoUpload,
  onPhotoDelete,
  showSetPrimary,
  isPhotoUploading,
  isPhotoDeleting,
  isSettingPrimary,
}: {
  bike: Bike;
  onEdit: () => void;
  onDelete: () => void;
  onSetPrimary: () => void;
  onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPhotoDelete: () => void;
  showSetPrimary: boolean;
  isPhotoUploading: boolean;
  isPhotoDeleting: boolean;
  isSettingPrimary: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">
              {bike.year} {bike.make} {bike.model}
            </CardTitle>
            {bike.trim && <p className="text-sm text-muted-foreground">{bike.trim}</p>}
          </div>
          {bike.is_primary && <Badge variant="secondary">Primary</Badge>}
        </div>
      </CardHeader>
      <CardContent>
        {/* Photo section */}
        <div className="mb-4">
          {bike.has_photo ? (
            <div className="relative">
              <img
                src={`/api/bikes/${bike.id}/photo?size=full`}
                alt={`${bike.year} ${bike.make} ${bike.model}`}
                className="w-full h-48 object-cover rounded-md"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 size-7"
                onClick={onPhotoDelete}
                disabled={isPhotoDeleting}
              >
                <X className="size-4" />
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isPhotoUploading}
              className="w-full h-32 border-2 border-dashed rounded-md flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer"
            >
              {isPhotoUploading ? (
                <Loader2 className="size-6 animate-spin" />
              ) : (
                <>
                  <Camera className="size-6" />
                  <span className="text-sm">Add Photo</span>
                </>
              )}
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPhotoUpload}
          />
          {bike.has_photo && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 w-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={isPhotoUploading}
            >
              {isPhotoUploading ? (
                <Loader2 className="mr-1 size-3 animate-spin" />
              ) : (
                <Camera className="mr-1 size-3" />
              )}
              Replace Photo
            </Button>
          )}
        </div>

        {bike.mods && (
          <div className="mb-4">
            <p className="text-xs font-medium text-muted-foreground mb-1">Mods</p>
            <p className="text-sm">{bike.mods}</p>
          </div>
        )}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="mr-1 size-3" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="mr-1 size-3" />
            Delete
          </Button>
          {showSetPrimary && (
            <Button variant="outline" size="sm" onClick={onSetPrimary} disabled={isSettingPrimary}>
              <Star className="mr-1 size-3" />
              Set Primary
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function BikeFormDialog({
  open,
  onClose,
  bike,
  onSubmit,
  isPending,
  error,
}: {
  open: boolean;
  onClose: () => void;
  bike: Bike | null;
  onSubmit: (data: BikeCreateInput) => void;
  isPending: boolean;
  error?: string;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BikeCreateInput>({
    resolver: zodResolver(BikeCreateInputSchema),
    values: bike
      ? { year: bike.year, make: bike.make, model: bike.model, trim: bike.trim, mods: bike.mods }
      : { year: new Date().getFullYear(), make: "", model: "", trim: null, mods: null },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{bike ? "Edit Bike" : "Add Bike"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bike-year">Year</Label>
              <Input id="bike-year" type="number" {...register("year", { valueAsNumber: true })} />
              {errors.year && <p className="text-sm text-destructive">{errors.year.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="bike-make">Make</Label>
              <Input id="bike-make" {...register("make")} placeholder="Harley-Davidson" />
              {errors.make && <p className="text-sm text-destructive">{errors.make.message}</p>}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bike-model">Model</Label>
              <Input id="bike-model" {...register("model")} placeholder="Road King" />
              {errors.model && <p className="text-sm text-destructive">{errors.model.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="bike-trim">Trim</Label>
              <Input id="bike-trim" {...register("trim")} placeholder="Special" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bike-mods">Mods</Label>
            <Textarea
              id="bike-mods"
              {...register("mods")}
              placeholder="Describe any modifications..."
              rows={3}
              maxLength={500}
            />
            {errors.mods && <p className="text-sm text-destructive">{errors.mods.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : bike ? "Save" : "Add Bike"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
