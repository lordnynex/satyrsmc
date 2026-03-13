import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { trpc } from "@/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SignupPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [birthday, setBirthday] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const validateQuery = trpc.auth.validateToken.useQuery(
    { token },
    { enabled: token.length > 0, retry: false },
  );
  const signupMutation = trpc.auth.signup.useMutation();

  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  useEffect(() => {
    if (validateQuery.isSuccess) {
      setTokenValid(validateQuery.data.valid);
    } else if (validateQuery.isError) {
      setTokenValid(false);
    }
  }, [validateQuery.isSuccess, validateQuery.isError, validateQuery.data]);

  if (!token || tokenValid === false) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Invalid Link</CardTitle>
          <CardDescription>
            This signup link is invalid or has expired. Please register again or contact an
            administrator.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/register">
            <Button variant="outline" className="w-full">
              Register
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (success) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Account Created</CardTitle>
          <CardDescription>
            Your account has been created and is pending admin approval. You will be notified when
            your account is activated.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/login">
            <Button variant="outline" className="w-full">
              Go to Login
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== passwordConfirm) {
      setError("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      await signupMutation.mutateAsync({
        token,
        username,
        password,
        password_confirm: passwordConfirm,
        birthday,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Complete Your Account</CardTitle>
        <CardDescription>
          {validateQuery.data?.first_name ? `Welcome, ${validateQuery.data.first_name}! ` : ""}
          Choose a username and password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              minLength={3}
              maxLength={30}
            />
            <p className="text-xs text-muted-foreground">
              3-30 characters. Letters, numbers, dots, and hyphens.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              minLength={8}
            />
            <p className="text-xs text-muted-foreground">
              8+ characters with uppercase, lowercase, number, and special character.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="passwordConfirm">Confirm Password</Label>
            <Input
              id="passwordConfirm"
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="birthday">Date of Birth</Label>
            <Input
              id="birthday"
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Creating Account..." : "Create Account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
