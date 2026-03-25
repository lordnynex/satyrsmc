import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { trpc, InvitationPurpose } from "@satyrsmc/shared/client";
import { InvitationSignupInputSchema } from "@satyrsmc/shared/dto/auth";
import { Hero } from "../components/Hero";

// Form fields (token injected at submit time)
const FormSchema = InvitationSignupInputSchema.innerType().omit({ token: true });
type FormValues = z.infer<typeof FormSchema>;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-sm mt-1" style={{ color: "#ef4444" }}>
      {message}
    </p>
  );
}

const PURPOSE_TITLES: Partial<Record<InvitationPurpose, string>> = {
  [InvitationPurpose.AccountSetup]: "Create Your Account",
  [InvitationPurpose.OfficerInvite]: "You've Been Invited",
  [InvitationPurpose.RideWalkin]: "Welcome to the Club",
};

const InvitationPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [signupComplete, setSignupComplete] = useState(false);

  const validateQuery = trpc.admin.invitations.validate.useQuery(
    { token: token ?? "" },
    { enabled: !!token, retry: false },
  );

  const signupMutation = trpc.auth.signupWithInvitation.useMutation({
    onSuccess: () => {
      setSignupComplete(true);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      username: "",
      password: "",
      password_confirm: "",
      birthday: "",
    },
  });

  const onSubmit = (data: FormValues) => {
    if (!token) return;
    signupMutation.mutate({ ...data, token });
  };

  // Loading
  if (validateQuery.isLoading) {
    return (
      <div className="stack max-w-3xl mx-auto" style={{ gap: "var(--space-6)" }}>
        <Hero title="Invitation" />
        <div className="card">
          <div className="card-body text-center py-12" style={{ color: "var(--color-muted)" }}>
            Validating invitation...
          </div>
        </div>
      </div>
    );
  }

  // Invalid token
  if (!token || validateQuery.data?.valid === false || validateQuery.error) {
    const reason = validateQuery.data?.valid === false ? validateQuery.data.reason : "not_found";
    return (
      <div className="stack max-w-3xl mx-auto" style={{ gap: "var(--space-6)" }}>
        <Hero title="Invitation" />
        <div className="card">
          <div className="card-body text-center py-12">
            <p className="text-lg font-semibold mb-2" style={{ color: "#ef4444" }}>
              {reason === "expired"
                ? "This invitation has expired."
                : reason === "claimed"
                  ? "This invitation has already been used."
                  : "This invitation link is not valid."}
            </p>
            <p style={{ color: "var(--color-muted)" }}>
              Please contact the club if you need a new invitation.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Signup complete
  if (signupComplete) {
    return (
      <div className="stack max-w-3xl mx-auto" style={{ gap: "var(--space-6)" }}>
        <Hero title="Account Created!" />
        <div className="card">
          <div className="card-body text-center py-12">
            <p className="text-lg font-semibold mb-4" style={{ color: "var(--color-accent)" }}>
              Your account has been created.
            </p>
            <p className="mb-6" style={{ color: "var(--color-muted)" }}>
              An admin will review and activate your account. You&rsquo;ll be able to log in once
              your account is approved.
            </p>
            <a
              href="/admin/login"
              className="btn btn-outline inline-block"
              style={{ textDecoration: "none" }}
            >
              Go to Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  const data = validateQuery.data;
  if (!data || data.valid !== true) return null;

  const title = PURPOSE_TITLES[data.purpose] ?? "Create Your Account";
  const contactName = [data.contact?.firstName, data.contact?.lastName].filter(Boolean).join(" ");

  return (
    <div className="stack max-w-3xl mx-auto" style={{ gap: "var(--space-6)" }}>
      <Hero title={title} />

      <div className="card">
        <div className="card-body">
          {contactName && (
            <p className="text-center mb-6" style={{ color: "var(--color-muted)" }}>
              Welcome, <strong style={{ color: "var(--color-text)" }}>{contactName}</strong>. Create
              your account to access the member portal.
            </p>
          )}

          {data.event && (
            <div className="text-center mb-6" style={{ color: "var(--color-muted)" }}>
              <p className="m-0">
                Event: <strong style={{ color: "var(--color-accent)" }}>{data.event.name}</strong>
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
            <fieldset className="flex flex-col gap-4">
              <legend className="text-lg font-semibold mb-2" style={{ color: "var(--color-text)" }}>
                Account Details
              </legend>

              <div>
                <label htmlFor="username" className="label">
                  Username *
                </label>
                <input
                  id="username"
                  type="text"
                  className="input w-full"
                  autoComplete="username"
                  {...register("username")}
                />
                <FieldError message={errors.username?.message} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="password" className="label">
                    Password *
                  </label>
                  <input
                    id="password"
                    type="password"
                    className="input w-full"
                    autoComplete="new-password"
                    {...register("password")}
                  />
                  <FieldError message={errors.password?.message} />
                </div>
                <div>
                  <label htmlFor="password_confirm" className="label">
                    Confirm Password *
                  </label>
                  <input
                    id="password_confirm"
                    type="password"
                    className="input w-full"
                    autoComplete="new-password"
                    {...register("password_confirm")}
                  />
                  <FieldError message={errors.password_confirm?.message} />
                </div>
              </div>

              <div>
                <label htmlFor="birthday" className="label">
                  Date of Birth *
                </label>
                <input
                  id="birthday"
                  type="date"
                  className="input w-full"
                  {...register("birthday")}
                />
                <p className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>
                  You must be at least 18 years old.
                </p>
                <FieldError message={errors.birthday?.message} />
              </div>
            </fieldset>

            {signupMutation.error && (
              <p className="text-sm" style={{ color: "#ef4444" }}>
                {signupMutation.error.message || "Something went wrong. Please try again."}
              </p>
            )}

            <button
              type="submit"
              className="btn btn-primary w-full sm:w-fit self-center"
              disabled={signupMutation.isPending}
            >
              {signupMutation.isPending ? "Creating Account..." : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InvitationPage;
