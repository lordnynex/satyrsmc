import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ActivityMessageCode } from "@satyrsmc/shared/client";
import { MemberPosition } from "@satyrsmc/shared/lib/enums";
import { trpc } from "@/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  Pencil,
  Star,
  Mail,
  Phone,
  MapPin,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const activityLabels: Record<string, string> = {
  [ActivityMessageCode.EventAttended]: "Attended an event",
  [ActivityMessageCode.RunLed]: "Led a run",
  [ActivityMessageCode.EventReviewSubmitted]: "Submitted an event review",
  [ActivityMessageCode.RunReportSubmitted]: "Submitted a run report",
  [ActivityMessageCode.GalleryPhotoSubmitted]: "Submitted a gallery photo",
  [ActivityMessageCode.GalleryPhotosSubmitted]: "Submitted gallery photos",
  [ActivityMessageCode.ProfilePhotoSubmitted]: "Updated profile photo",
  [ActivityMessageCode.RigbookPhotoSubmitted]: "Submitted a rigbook photo",
  [ActivityMessageCode.Joined]: "Joined the club",
};

export function MemberProfilePage() {
  const { username } = useParams<{ username: string }>();
  const {
    data: profile,
    isLoading,
    error,
  } = trpc.members.profile.get.useQuery({ username: username! }, { enabled: !!username });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 p-4 md:p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold">Member Not Found</h1>
        <p className="text-muted-foreground">
          {error.data?.code === "NOT_FOUND" ? "This member could not be found." : error.message}
        </p>
      </div>
    );
  }

  if (!profile) return null;

  const bikesWithPhotos = profile.bikes.filter((b) => b.has_photo);
  const primaryBike = profile.bikes.find((b) => b.is_primary);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Static header: bike hero + avatar + name */}
      <BikeHeroCarousel bikes={bikesWithPhotos} primaryBike={primaryBike ?? null} />

      <div className="px-4 md:px-6">
        {/* Avatar + Name row, overlapping the hero */}
        <div className="-mt-12 flex items-end justify-between mb-4">
          <div className="flex items-end gap-4">
            {profile.has_photo && profile.photo_url ? (
              <img
                src={profile.photo_url}
                alt={profile.display_name}
                className="size-24 rounded-full border-4 border-background object-cover"
              />
            ) : (
              <div className="size-24 rounded-full border-4 border-background bg-muted flex items-center justify-center text-3xl font-bold text-muted-foreground">
                {(profile.first_name?.[0] ?? profile.username[0]).toUpperCase()}
              </div>
            )}
            <div className="pb-1">
              <h1 className="text-2xl font-bold">{profile.display_name}</h1>
              {profile.position && profile.position !== MemberPosition.Member && (
                <Badge variant="secondary" className="mt-1">
                  {profile.position}
                </Badge>
              )}
            </div>
          </div>
          {profile.is_own_profile && (
            <Link to="/settings/profile" className="pb-1">
              <Button variant="outline" size="sm">
                <Pencil className="mr-1 size-3" />
                Edit Profile
              </Button>
            </Link>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="garage">Garage</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 pt-4 pb-6">
            <Card>
              <CardContent className="pt-6">
                <dl className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">Name</dt>
                    <dd className="text-sm">{profile.display_name}</dd>
                  </div>
                  {profile.email && (
                    <div>
                      <dt className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <Mail className="size-3" />
                        Email
                      </dt>
                      <dd className="text-sm">
                        <a href={`mailto:${profile.email}`} className="hover:underline">
                          {profile.email}
                        </a>
                      </dd>
                    </div>
                  )}
                  {profile.phone && (
                    <div>
                      <dt className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <Phone className="size-3" />
                        Phone
                      </dt>
                      <dd className="text-sm">
                        <a
                          href={`tel:${profile.phone.replace(/\D/g, "")}`}
                          className="hover:underline"
                        >
                          {profile.phone}
                        </a>
                      </dd>
                    </div>
                  )}
                  {profile.member_since && (
                    <div>
                      <dt className="text-xs font-medium text-muted-foreground">Member Since</dt>
                      <dd className="text-sm">
                        {new Date(profile.member_since).toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                          timeZone: "UTC",
                        })}
                      </dd>
                    </div>
                  )}
                  {profile.address && (
                    <div>
                      <dt className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <MapPin className="size-3" />
                        Address
                      </dt>
                      <dd className="text-sm">
                        {[
                          profile.address.line1,
                          profile.address.line2,
                          [profile.address.city, profile.address.state, profile.address.postal_code]
                            .filter(Boolean)
                            .join(", "),
                        ]
                          .filter(Boolean)
                          .map((line, i) => (
                            <span key={i}>
                              {line}
                              <br />
                            </span>
                          ))}
                      </dd>
                    </div>
                  )}
                  {profile.birthday && (
                    <div>
                      <dt className="text-xs font-medium text-muted-foreground">Birthday</dt>
                      <dd className="text-sm">
                        {new Date(profile.birthday).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          timeZone: "UTC",
                        })}
                      </dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>

            {profile.is_own_profile && profile.emergency_contacts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShieldAlert className="size-4" />
                    Emergency Contacts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {profile.emergency_contacts.map((ec, i) => (
                      <li key={i} className="text-sm">
                        <p className="font-medium">{ec.name}</p>
                        <p className="text-muted-foreground">
                          <a
                            href={`tel:${ec.phone.replace(/\D/g, "")}`}
                            className="hover:underline"
                          >
                            {ec.phone}
                          </a>
                          {ec.relationship && ` — ${ec.relationship}`}
                        </p>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="garage" className="pt-4 pb-6">
            {profile.bikes.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No bikes in the garage.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {profile.bikes.map((bike) => (
                  <Card key={bike.id}>
                    {bike.has_photo && (
                      <img
                        src={`/api/bikes/${bike.id}/photo?size=full`}
                        alt={`${bike.year} ${bike.make} ${bike.model}`}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                    )}
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">
                          {bike.year} {bike.make} {bike.model}
                        </CardTitle>
                        {bike.is_primary && (
                          <Badge variant="secondary">
                            <Star className="mr-1 size-3" />
                            Primary
                          </Badge>
                        )}
                      </div>
                      {bike.trim && <p className="text-sm text-muted-foreground">{bike.trim}</p>}
                    </CardHeader>
                    {bike.mods && (
                      <CardContent>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Mods</p>
                        <p className="text-sm">{bike.mods}</p>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="activity" className="pt-4 pb-6">
            {profile.is_own_profile ? (
              <ActivityFeed />
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Activity is only visible on your own profile.
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ---- Bike Hero Carousel ----

interface BikeForHero {
  id: string;
  year: number;
  make: string;
  model: string;
  trim: string | null;
  has_photo: boolean;
}

function BikeHeroCarousel({
  bikes,
  primaryBike,
}: {
  bikes: BikeForHero[];
  primaryBike: BikeForHero | null;
}) {
  // Start on the primary bike if it has a photo, otherwise the first bike with a photo
  const primaryIndex = primaryBike ? bikes.findIndex((b) => b.id === primaryBike.id) : -1;
  const [currentIndex, setCurrentIndex] = useState(primaryIndex >= 0 ? primaryIndex : 0);

  // No bikes with photos — show a gradient placeholder
  if (bikes.length === 0) {
    return (
      <div className="relative h-48 md:h-64 bg-gradient-to-br from-muted to-muted-foreground/20 rounded-b-lg" />
    );
  }

  const current = bikes[currentIndex];
  const bikeLabel = [current.year, current.make, current.model, current.trim]
    .filter(Boolean)
    .join(" ");
  const showControls = bikes.length > 1;

  function prev() {
    setCurrentIndex((i) => (i === 0 ? bikes.length - 1 : i - 1));
  }

  function next() {
    setCurrentIndex((i) => (i === bikes.length - 1 ? 0 : i + 1));
  }

  return (
    <div className="relative h-48 md:h-64 overflow-hidden rounded-b-lg">
      <img
        src={`/api/bikes/${current.id}/photo?size=full`}
        alt={bikeLabel}
        className="w-full h-full object-cover brightness-[0.7]"
      />

      {/* Bike label overlay */}
      <div className="absolute bottom-3 right-4 text-white/80 text-xs font-medium drop-shadow">
        {bikeLabel}
      </div>

      {/* Carousel controls */}
      {showControls && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white hover:bg-black/60 transition-colors"
            aria-label="Previous bike"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white hover:bg-black/60 transition-colors"
            aria-label="Next bike"
          >
            <ChevronRight className="size-5" />
          </button>

          {/* Dot indicators */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {bikes.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`size-2 rounded-full transition-colors ${
                  i === currentIndex ? "bg-white" : "bg-white/40"
                }`}
                aria-label={`Show bike ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ---- Activity Feed ----

function ActivityFeed() {
  const { data, isLoading } = trpc.members.activityLogs.list.useQuery({ page: 1, per_page: 50 });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const items = data?.items ?? [];

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No activity yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between text-sm">
              <span>{activityLabels[item.message_code] ?? item.message_code}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(item.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  timeZone: "UTC",
                })}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
