import { useState } from "react";
import { Link } from "react-router-dom";
import { trpc } from "@/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const mutation = trpc.auth.forgotPassword.useMutation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await mutation.mutateAsync({ email });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Check Your Email</CardTitle>
          <CardDescription>
            If that email exists, a password reset link has been sent. Check your inbox.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/login">
            <Button variant="outline" className="w-full">
              Back to Login
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Forgot Password</CardTitle>
        <CardDescription>
          Enter your email and we will send you a link to reset your password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Sending..." : "Send Reset Link"}
          </Button>
          <div className="text-center text-sm text-muted-foreground">
            <Link to="/login" className="underline hover:text-foreground">
              Back to Login
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
