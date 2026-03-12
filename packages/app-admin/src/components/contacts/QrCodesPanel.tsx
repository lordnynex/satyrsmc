import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
import type { QrCode, QrCodeConfig } from "@satyrsmc/shared/client";
import {
  useQrCodesSuspense,
  useInvalidateQueries,
  useQrCodeImageUrl,
  useCreateQrCode,
  useUpdateQrCode,
  useDeleteQrCode,
  unwrapSuspenseData,
} from "@/queries/hooks";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, Download, ExternalLink } from "lucide-react";

const DEFAULT_CONFIG: QrCodeConfig = {
  errorCorrectionLevel: "M",
  width: 256,
  margin: 4,
  color: { dark: "#000000", light: "#ffffff" },
  format: "png",
};

export function QrCodesPanel() {
  const codes = unwrapSuspenseData(useQrCodesSuspense()) ?? [];
  const invalidate = useInvalidateQueries();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<QrCode | null>(null);
  const [deleting, setDeleting] = useState<QrCode | null>(null);

  const refresh = () => invalidate.invalidateQrCodes();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">QR Codes</h1>
          <p className="text-muted-foreground mt-1">
            Generate and manage QR codes that link to configurable URLs.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          New QR code
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {codes.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No QR codes yet. Create one to get started.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {codes.map((qr) => (
                <QrCodeCard
                  key={qr.id}
                  qr={qr}
                  onEdit={() => setEditing(qr)}
                  onDelete={() => setDeleting(qr)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateQrCodeDialog open={createOpen} onOpenChange={setCreateOpen} onSuccess={refresh} />

      {editing && (
        <EditQrCodeDialog
          qr={editing}
          open={!!editing}
          onOpenChange={(open) => !open && setEditing(null)}
          onSuccess={() => {
            refresh();
            setEditing(null);
          }}
        />
      )}

      {deleting && (
        <DeleteQrCodeDialog
          qr={deleting}
          open={!!deleting}
          onOpenChange={(open) => !open && setDeleting(null)}
          onSuccess={() => {
            refresh();
            setDeleting(null);
          }}
        />
      )}
    </div>
  );
}

function QrCodeCard({
  qr,
  onEdit,
  onDelete,
}: {
  qr: QrCode;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const navigate = useNavigate();
  const { data: imageUrl = "" } = useQrCodeImageUrl(qr.id);

  const handleCardClick = () => navigate(`/contacts/qr-codes/${qr.id}`);
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit();
  };
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `${qr.name || "qr-code"}.${qr.config?.format ?? "png"}`;
    a.click();
  };

  return (
    <div
      className="flex cursor-pointer flex-col gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50"
      onClick={handleCardClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate">{qr.name || "Untitled"}</p>
          <a
            href={qr.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-sm text-muted-foreground hover:text-foreground truncate block"
          >
            {qr.url}
          </a>
        </div>
        <div className="flex shrink-0 gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" onClick={handleEdit} aria-label="Edit">
            <Pencil className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDelete} aria-label="Delete">
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex size-24 shrink-0 items-center justify-center rounded border bg-white p-1">
          <img
            src={imageUrl || undefined}
            alt={`QR code for ${qr.name || qr.url}`}
            className="size-full object-contain"
          />
        </div>
        <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="size-4" />
            Download
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={qr.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-4" />
              Open URL
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}

function CreateQrCodeDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const createMutation = useCreateQrCode();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [config, setConfig] = useState<NonNullable<QrCodeConfig>>({ ...DEFAULT_CONFIG });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!url.trim()) {
      setError("URL is required");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await createMutation.mutateAsync({
        name: name.trim() || null,
        url: url.trim(),
        config,
      });
      setName("");
      setUrl("");
      setConfig({ ...DEFAULT_CONFIG });
      onOpenChange(false);
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-lg">
        <DialogHeader>
          <DialogTitle>Create QR code</DialogTitle>
        </DialogHeader>
        <QrCodeForm
          name={name}
          setName={setName}
          url={url}
          setUrl={setUrl}
          config={config}
          setConfig={setConfig}
          error={error}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving || !url.trim()}>
            {saving ? "Creating…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditQrCodeDialog({
  qr,
  open,
  onOpenChange,
  onSuccess,
}: {
  qr: QrCode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const updateMutation = useUpdateQrCode();
  const [name, setName] = useState(qr.name ?? "");
  const [url, setUrl] = useState(qr.url);
  const [config, setConfig] = useState<NonNullable<QrCodeConfig>>(
    qr.config ?? { ...DEFAULT_CONFIG },
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!url.trim()) {
      setError("URL is required");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await updateMutation.mutateAsync({
        id: qr.id,
        body: {
          name: name.trim() || null,
          url: url.trim(),
          config,
        },
      });
      onOpenChange(false);
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit QR code</DialogTitle>
        </DialogHeader>
        <QrCodeForm
          name={name}
          setName={setName}
          url={url}
          setUrl={setUrl}
          config={config}
          setConfig={setConfig}
          error={error}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving || !url.trim()}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function QrCodeForm({
  name,
  setName,
  url,
  setUrl,
  config,
  setConfig,
  error,
}: {
  name: string;
  setName: (v: string) => void;
  url: string;
  setUrl: (v: string) => void;
  config: NonNullable<QrCodeConfig>;
  setConfig: (c: NonNullable<QrCodeConfig>) => void;
  error: string | null;
}) {
  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div>
        <Label>Name (optional)</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Event registration"
        />
      </div>
      <div>
        <Label>URL *</Label>
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/page"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Error correction</Label>
          <Select
            value={config.errorCorrectionLevel ?? "M"}
            onValueChange={(v) =>
              setConfig({ ...config, errorCorrectionLevel: v as "L" | "M" | "Q" | "H" })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="L">L (7%)</SelectItem>
              <SelectItem value="M">M (15%)</SelectItem>
              <SelectItem value="Q">Q (25%)</SelectItem>
              <SelectItem value="H">H (30%)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Format</Label>
          <Select
            value={config.format ?? "png"}
            onValueChange={(v) => setConfig({ ...config, format: v as "png" | "svg" })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="png">PNG</SelectItem>
              <SelectItem value="svg">SVG</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Width (px)</Label>
          <Input
            type="number"
            min={64}
            max={1024}
            value={config.width ?? 256}
            onChange={(e) =>
              setConfig({ ...config, width: Math.max(64, parseInt(e.target.value, 10) || 256) })
            }
          />
        </div>
        <div>
          <Label>Margin (modules)</Label>
          <Input
            type="number"
            min={0}
            max={20}
            value={config.margin ?? 4}
            onChange={(e) =>
              setConfig({ ...config, margin: Math.max(0, parseInt(e.target.value, 10) || 4) })
            }
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Foreground color</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={config.color?.dark ?? "#000000"}
              onChange={(e) =>
                setConfig({
                  ...config,
                  color: { ...config.color, dark: e.target.value },
                })
              }
              className="h-9 w-14 p-1 cursor-pointer"
            />
            <Input
              value={config.color?.dark ?? "#000000"}
              onChange={(e) =>
                setConfig({
                  ...config,
                  color: { ...config.color, dark: e.target.value },
                })
              }
              className="flex-1 font-mono text-sm"
            />
          </div>
        </div>
        <div>
          <Label>Background color</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={config.color?.light ?? "#ffffff"}
              onChange={(e) =>
                setConfig({
                  ...config,
                  color: { ...config.color, light: e.target.value },
                })
              }
              className="h-9 w-14 p-1 cursor-pointer"
            />
            <Input
              value={config.color?.light ?? "#ffffff"}
              onChange={(e) =>
                setConfig({
                  ...config,
                  color: { ...config.color, light: e.target.value },
                })
              }
              className="flex-1 font-mono text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function DeleteQrCodeDialog({
  qr,
  open,
  onOpenChange,
  onSuccess,
}: {
  qr: QrCode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const deleteMutation = useDeleteQrCode();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteMutation.mutateAsync(qr.id);
      onOpenChange(false);
      onSuccess();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete QR code</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground">
          Are you sure you want to delete &quot;{qr.name || "Untitled"}&quot;? This cannot be
          undone.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
