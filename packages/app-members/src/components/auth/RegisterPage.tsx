import { useState } from "react";
import { Link } from "react-router-dom";
import { trpc } from "@/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function RegisterPage() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const registerMutation = trpc.auth.register.useMutation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await registerMutation.mutateAsync({
        email,
        first_name: firstName,
        last_name: lastName,
        recaptcha_token: "skip",
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
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
            If that email is eligible, a registration link has been sent. Check your inbox to
            continue.
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
        <CardTitle>Register</CardTitle>
        <CardDescription>Create an account to access the members section.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
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
            {submitting ? "Registering..." : "Register"}
          </Button>
          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="underline hover:text-foreground">
              Log in
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
