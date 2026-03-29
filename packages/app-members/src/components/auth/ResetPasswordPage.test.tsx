import { describe, test, expect } from "vitest";
import { waitFor, within } from "@testing-library/react";
import { renderWithProviders } from "@/test/renderWithProviders";
import { ResetPasswordPage } from "./ResetPasswordPage";

function getScreen() {
  return within(document.body);
}

describe("ResetPasswordPage", () => {
  test("renders Invalid Link card without wrapper div when no token", () => {
    const { container } = renderWithProviders(<ResetPasswordPage />, {
      initialEntries: ["/reset-password"],
    });

    expect(getScreen().getByText("Invalid Link")).not.toBeNull();
    expect(getScreen().getByText("Request New Link")).not.toBeNull();

    // Verify no min-h-screen wrapper div (the old bug)
    const wrapper = container.querySelector(".min-h-screen");
    expect(wrapper).toBeNull();
  });

  test("renders password form when token is present", () => {
    renderWithProviders(<ResetPasswordPage />, {
      initialEntries: ["/reset-password?token=some-token"],
    });

    expect(getScreen().getByLabelText("New Password")).not.toBeNull();
    expect(getScreen().getByLabelText("Confirm New Password")).not.toBeNull();
    expect(getScreen().getByRole("button", { name: "Reset Password" })).not.toBeNull();
  });

  test("shows password mismatch error", async () => {
    renderWithProviders(<ResetPasswordPage />, {
      initialEntries: ["/reset-password?token=some-token"],
    });

    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();

    await user.type(getScreen().getByLabelText("New Password"), "Password1!");
    await user.type(getScreen().getByLabelText("Confirm New Password"), "Different1!");
    await user.click(getScreen().getByRole("button", { name: "Reset Password" }));

    await waitFor(() => {
      expect(getScreen().getByText("Passwords do not match")).not.toBeNull();
    });
  });

  test("shows success card without wrapper div after successful reset", async () => {
    const handlers = {
      "auth.resetPassword": () => ({ success: true }),
    };

    const { container } = renderWithProviders(<ResetPasswordPage />, {
      initialEntries: ["/reset-password?token=valid-token"],
      handlers,
    });

    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();

    await user.type(getScreen().getByLabelText("New Password"), "Password1!");
    await user.type(getScreen().getByLabelText("Confirm New Password"), "Password1!");
    await user.click(getScreen().getByRole("button", { name: "Reset Password" }));

    await waitFor(() => {
      expect(getScreen().getByText("Password Reset")).not.toBeNull();
      expect(getScreen().getByText("Go to Login")).not.toBeNull();
    });

    // Verify no min-h-screen wrapper div
    const wrapper = container.querySelector(".min-h-screen");
    expect(wrapper).toBeNull();
  });
});
