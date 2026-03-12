import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useQrCodeSuspense,
  useInvalidateQueries,
  useQrCodeImageUrl,
  useUpdateQrCode,
  useDeleteQrCode,
  unwrapSuspenseData,
} from "@/queries/hooks";
import { ArrowLeft, Download, ExternalLink, Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { QrCode, QrCodeConfig } from "@satyrsmc/shared/client";

const SIZE_PRESETS = [
  { label: "Small (128px)", value: 128 },
  { label: "Medium (256px)", value: 256 },
  { label: "Large (512px)", value: 512 },
  { label: "Extra large (1024px)", value: 1024 },
];

const DEFAULT_CONFIG: QrCodeConfig = {
  errorCorrectionLevel: "M",
  width: 256,
  margin: 4,
  color: { dark: "#000000", light: "#ffffff" },
  format: "png",
};

export function QrCodeDetailPage() {
  const { id } = useParams<{ id: string }>();
  if (!id) return null;
  return <QrCodeDetailContent id={id} />;
}

function QrCodeDetailContent({ id }: { id: string }) {
  const navigate = useNavigate();
  const invalidate = useInvalidateQueries();
  const qr = unwrapSuspenseData(useQrCodeSuspense(id))!;
  const _updateMutation = useUpdateQrCode();
  const _deleteMutation = useDeleteQrCode();
  const [displaySize, setDisplaySize] = useState(256);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const format = qr.config?.format ?? "png";

  const { data: effectiveImageUrl = "" } = useQrCodeImageUrl(id, displaySize);

  const handleDownload = () => {
    if (!effectiveImageUrl) return;
    const a = document.createElement("a");
    a.href = effectiveImageUrl;
    a.download = `${qr.name || "qr-code"}.${format}`;
    a.click();
  };

  const refresh = () => {
    invalidate.invalidateQrCode(id);
    invalidate.invalidateQrCodes();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/contacts/qr-codes")}
            aria-label="Back"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{qr.name || "Untitled"}</h1>
            <a
              href={qr.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {qr.url}
            </a>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="size-4" />
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => setDeleting(true)}>
            <Trash2 className="size-4" />
            Delete
          </Button>
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

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            <div className="flex flex-col gap-4">
              <div className="rounded-lg border bg-white p-4">
                <img
                  src={effectiveImageUrl || undefined}
                  alt={`QR code for ${qr.name || qr.url}`}
                  width={displaySize}
                  height={displaySize}
                  className="max-w-full"
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-muted-foreground">Display size</p>
                <div className="flex flex-wrap gap-2">
                  {SIZE_PRESETS.map((preset) => (
                    <Button
                      key={preset.value}
                      variant={displaySize === preset.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDisplaySize(preset.value)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Choose a size to preview or download. Larger sizes are better for print.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {editing && (
        <EditQrCodeDialog
          qr={qr}
          open={editing}
          onOpenChange={setEditing}
          onSuccess={() => {
            refresh();
            setEditing(false);
          }}
        />
      )}

      {deleting && (
        <DeleteQrCodeDialog
          qr={qr}
          open={deleting}
          onOpenChange={setDeleting}
          onSuccess={() => {
            navigate("/contacts/qr-codes");
            refresh();
          }}
        />
      )}
    </div>
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
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/page"
        />
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
