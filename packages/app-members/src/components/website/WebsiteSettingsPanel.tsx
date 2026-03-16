import { useEffect, useState } from "react";
import { useWebsiteSettingsOptional, useWebsiteUpdateSettings } from "@/queries/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings } from "lucide-react";

export function WebsiteSettingsPanel() {
  const { data: settings, isLoading } = useWebsiteSettingsOptional();
  const updateMutation = useWebsiteUpdateSettings();

  const [title, setTitle] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [footerText, setFooterText] = useState("");
  const [defaultMetaDescription, setDefaultMetaDescription] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  useEffect(() => {
    if (settings) {
      setTitle(settings.title ?? "");
      setLogoUrl(settings.logo_url ?? "");
      setFooterText(settings.footer_text ?? "");
      setDefaultMetaDescription(settings.default_meta_description ?? "");
      setContactEmail(settings.contact_email ?? "");
    }
  }, [settings]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    updateMutation.mutate({
      title: title.trim() || null,
      logo_url: logoUrl.trim() || null,
      footer_text: footerText.trim() || null,
      default_meta_description: defaultMetaDescription.trim() || null,
      contact_email: contactEmail.trim() || null,
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="size-5" />
            Site settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Global settings for the public site: title, logo, footer text, default meta description,
            and contact email for form submissions.
          </p>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <form onSubmit={handleSubmit} className="grid gap-4 max-w-xl">
              <div className="grid gap-2">
                <Label htmlFor="title">Site title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="My Club"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="logo_url">Logo URL</Label>
                <Input
                  id="logo_url"
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://…"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="footer_text">Footer text</Label>
                <textarea
                  id="footer_text"
                  className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  placeholder="Copyright …"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="default_meta_description">Default meta description (SEO)</Label>
                <textarea
                  id="default_meta_description"
                  className="min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={defaultMetaDescription}
                  onChange={(e) => setDefaultMetaDescription(e.target.value)}
                  placeholder="Optional default for pages without their own meta description"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contact_email">Contact email (for Contact us form)</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="contact@example.com"
                />
              </div>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving…" : "Save settings"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
