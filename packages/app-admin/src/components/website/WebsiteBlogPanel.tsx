import { useWebsiteBlogAll } from "@/queries/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateOnly } from "@/lib/date-utils";
import { BookOpen } from "lucide-react";

export function WebsiteBlogPanel() {
  const { data: posts = [], isLoading } = useWebsiteBlogAll();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="size-5" />
            Blog
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Publish and manage blog posts on the public site. Create posts with rich content,
            featured images, and per-post SEO. Control publish date and visibility. Public list:{" "}
            <code className="text-xs bg-muted px-1 rounded">/api/website/blog</code>. Single post by
            slug: <code className="text-xs bg-muted px-1 rounded">/api/website/blog/slug/:slug</code>.
          </p>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : posts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No blog posts yet. Use the API to create: POST /api/website/blog</p>
          ) : (
            <ul className="space-y-2">
              {posts.map((post) => (
                <li key={post.id} className="rounded-md border px-3 py-2">
                  <span className="font-medium">{post.title}</span>
                  <span className="ml-2 text-muted-foreground text-sm">/{post.slug}</span>
                  {post.published_at ? (
                    <span className="ml-2 text-muted-foreground text-sm">
                      (published {formatDateOnly(post.published_at)})
                    </span>
                  ) : (
                    <span className="ml-2 text-muted-foreground text-sm">(draft)</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
