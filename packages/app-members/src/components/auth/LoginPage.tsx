import { useRef, useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import ReCAPTCHA from "react-google-recaptcha";
import { LoginInputSchema } from "@satyrsmc/shared/dto/auth";
import type { LoginInput } from "@satyrsmc/shared/dto/auth";
import { useAuth } from "@/state/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RECAPTCHA_SITE_KEY } from "@/lib/constants";

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/";

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, from, navigate]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginInputSchema),
    defaultValues: {
      username: "",
      password: "",
      recaptcha_token: RECAPTCHA_SITE_KEY ? "" : "disabled",
    },
  });

  if (isAuthenticated) {
    return null;
  }

  const onSubmit = async (data: LoginInput) => {
    setError(null);
    try {
      await login(data.username, data.password, data.recaptcha_token);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      if (RECAPTCHA_SITE_KEY) {
        recaptchaRef.current?.reset();
        setValue("recaptcha_token", "");
      }
    }
  };

  const handleRecaptchaChange = (token: string | null) => {
    setValue("recaptcha_token", token ?? "", { shouldValidate: true });
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Log In</CardTitle>
        <CardDescription>Enter your credentials to access your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" autoComplete="username" {...register("username")} />
            {errors.username && (
              <p className="text-sm text-destructive">{errors.username.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          {RECAPTCHA_SITE_KEY && (
            <div>
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={RECAPTCHA_SITE_KEY}
                onChange={handleRecaptchaChange}
                onExpired={() => setValue("recaptcha_token", "")}
              />
              {errors.recaptcha_token && (
                <p className="text-sm text-destructive">{errors.recaptcha_token.message}</p>
              )}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Logging in..." : "Log In"}
          </Button>
          <div className="text-center text-sm text-muted-foreground">
            <Link to="/forgot-password" className="underline hover:text-foreground">
              Forgot password?
            </Link>
            {" | "}
            <Link to="/register" className="underline hover:text-foreground">
              Register
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
