import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import ReCAPTCHA from "react-google-recaptcha";
import { RegisterInputSchema } from "@satyrsmc/shared/dto/auth";
import type { RegisterInput } from "@satyrsmc/shared/dto/auth";
import { trpc } from "@/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

declare const __BUILD_RECAPTCHA_SITE_KEY__: string;
const RECAPTCHA_SITE_KEY = __BUILD_RECAPTCHA_SITE_KEY__ || "";

export function RegisterPage() {
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterInputSchema),
    defaultValues: {
      email: "",
      first_name: "",
      last_name: "",
      recaptcha_token: RECAPTCHA_SITE_KEY ? "" : "disabled",
    },
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => setSuccess(true),
    onError: () => {
      if (RECAPTCHA_SITE_KEY) {
        recaptchaRef.current?.reset();
        setValue("recaptcha_token", "");
      }
    },
  });

  const onSubmit = (data: RegisterInput) => {
    registerMutation.mutate(data);
  };

  const handleRecaptchaChange = (token: string | null) => {
    setValue("recaptcha_token", token ?? "", { shouldValidate: true });
  };

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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {registerMutation.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {registerMutation.error.message}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input id="firstName" {...register("first_name")} />
            {errors.first_name && (
              <p className="text-sm text-destructive">{errors.first_name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input id="lastName" {...register("last_name")} />
            {errors.last_name && (
              <p className="text-sm text-destructive">{errors.last_name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...register("email")} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
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
            {isSubmitting ? "Registering..." : "Register"}
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
