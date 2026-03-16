import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center p-4 md:p-6">
      <div className="text-center">
        <p className="text-6xl font-bold text-muted-foreground">404</p>
        <h1 className="mt-2 text-xl font-semibold">Page not found</h1>
        <p className="mt-2 max-w-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button asChild className="mt-6">
          <Link to="/">Back to Home</Link>
        </Button>
      </div>
    </main>
  );
}
