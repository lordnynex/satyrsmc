import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserStatus } from "@satyrsmc/shared/client";
import {
  ChangePasswordInputSchema,
  ChangeEmailInputSchema,
  type ChangePasswordInput,
  type ChangeEmailInput,
} from "@satyrsmc/shared/dto/member/settings";
import { trpc } from "@/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

const statusColors: Record<string, string> = {
  [UserStatus.Active]: "bg-green-500/10 text-green-700 border-green-500/30",
  [UserStatus.Locked]: "bg-purple-500/10 text-purple-700 border-purple-500/30",
  [UserStatus.Suspended]: "bg-red-500/10 text-red-700 border-red-500/30",
};

export function AccountSettingsPage() {
  const { data, isLoading } = trpc.members.settings.getAccount.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Account Settings</h1>

      {/* Account info */}
      {data && (
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Username</dt>
                <dd className="text-sm">{data.username}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Status</dt>
                <dd>
                  <Badge variant="outline" className={statusColors[data.user_status] ?? ""}>
                    {data.user_status}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Type</dt>
                <dd className="text-sm">{data.user_type}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Email</dt>
                <dd className="text-sm">{data.email ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Joined</dt>
                <dd className="text-sm">
                  {data.created_at
                    ? new Date(data.created_at).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                        timeZone: "UTC",
                      })
                    : "—"}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}

      <ChangePasswordForm />
      <ChangeEmailForm />

      {/* Dues placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Dues & Payments</CardTitle>
          <CardDescription>Coming Soon</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Dues and payment management will be available in a future update.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function ChangePasswordForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(ChangePasswordInputSchema),
    defaultValues: { current_password: "", new_password: "", confirm_password: "" },
  });

  const mutation = trpc.members.settings.changePassword.useMutation({
    onSuccess: () => reset(),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit((data) => mutation.mutate(data))}
          className="space-y-4 max-w-md"
        >
          {mutation.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {mutation.error.message}
            </div>
          )}
          {mutation.isSuccess && (
            <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-700">
              Password changed successfully.
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="current_password">Current Password</Label>
            <Input id="current_password" type="password" {...register("current_password")} />
            {errors.current_password && (
              <p className="text-sm text-destructive">{errors.current_password.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="new_password">New Password</Label>
            <Input id="new_password" type="password" {...register("new_password")} />
            {errors.new_password && (
              <p className="text-sm text-destructive">{errors.new_password.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm_password">Confirm New Password</Label>
            <Input id="confirm_password" type="password" {...register("confirm_password")} />
            {errors.confirm_password && (
              <p className="text-sm text-destructive">{errors.confirm_password.message}</p>
            )}
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Changing..." : "Change Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ChangeEmailForm() {
  const utils = trpc.useUtils();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangeEmailInput>({
    resolver: zodResolver(ChangeEmailInputSchema),
    defaultValues: { new_email: "", password: "" },
  });

  const mutation = trpc.members.settings.changeEmail.useMutation({
    onSuccess: () => {
      utils.members.settings.getAccount.invalidate();
      reset();
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Email</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit((data) => mutation.mutate(data))}
          className="space-y-4 max-w-md"
        >
          {mutation.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {mutation.error.message}
            </div>
          )}
          {mutation.isSuccess && (
            <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-700">
              Email changed successfully.
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="new_email">New Email</Label>
            <Input id="new_email" type="email" {...register("new_email")} />
            {errors.new_email && (
              <p className="text-sm text-destructive">{errors.new_email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email_password">Password</Label>
            <Input id="email_password" type="password" {...register("password")} />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Changing..." : "Change Email"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
