import { useParams, Link } from "react-router-dom";
import { ActivityMessageCode } from "@satyrsmc/shared/client";
import { MemberPosition } from "@satyrsmc/shared/lib/enums";
import { trpc } from "@/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Pencil, Star } from "lucide-react";

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
      <div className="space-y-6 p-4 md:p-6">
        <h1 className="text-2xl font-bold">Member Not Found</h1>
        <p className="text-muted-foreground">
          {error.data?.code === "NOT_FOUND" ? "This member could not be found." : error.message}
        </p>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {profile.has_photo && profile.photo_url ? (
            <img
              src={profile.photo_url}
              alt={profile.display_name}
              className="size-20 rounded-full object-cover"
            />
          ) : (
            <div className="size-20 rounded-full bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground">
              {(profile.first_name?.[0] ?? profile.username[0]).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">{profile.display_name}</h1>
            {profile.position && profile.position !== MemberPosition.Member && (
              <Badge variant="secondary" className="mt-1">
                {profile.position}
              </Badge>
            )}
          </div>
        </div>
        {profile.is_own_profile && (
          <Link to="/settings/profile">
            <Button variant="outline" size="sm">
              <Pencil className="mr-1 size-3" />
              Edit Profile
            </Button>
          </Link>
        )}
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="garage">Garage</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4 pt-4">
          <Card>
            <CardContent className="pt-6">
              <dl className="grid gap-3 sm:grid-cols-2">
                {profile.city && (
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">Location</dt>
                    <dd className="text-sm">
                      {[profile.city, profile.state].filter(Boolean).join(", ")}
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
        </TabsContent>

        <TabsContent value="garage" className="pt-4">
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

        <TabsContent value="activity" className="pt-4">
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
  );
}

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
