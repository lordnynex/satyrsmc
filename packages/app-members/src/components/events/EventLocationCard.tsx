import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface EventLocationCardProps {
  mapEmbedUrl: string;
}

export function EventLocationCard({ mapEmbedUrl }: EventLocationCardProps) {
  return (
    <Card id="location" className="overflow-hidden scroll-mt-28">
      <CardHeader>
        <CardTitle className="text-lg">Location</CardTitle>
        <CardDescription>Event venue on map</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <iframe
          src={mapEmbedUrl}
          width="100%"
          height="200"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Event location"
          className="w-full"
        />
      </CardContent>
    </Card>
  );
}
