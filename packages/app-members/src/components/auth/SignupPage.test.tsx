import { describe, test, expect } from "vitest";
import { waitFor, within } from "@testing-library/react";
import { renderWithProviders } from "@/test/renderWithProviders";
import { SignupPage } from "./SignupPage";

function getScreen() {
  return within(document.body);
}

describe("SignupPage", () => {
  test("shows Invalid Link when no token is provided", async () => {
    renderWithProviders(<SignupPage />, {
      initialEntries: ["/signup"],
    });

    await waitFor(() => {
      expect(getScreen().getByText("Invalid Link")).not.toBeNull();
    });
  });

  test("shows Validating Link while token validation is in-flight", async () => {
    // Use a handler that never resolves to keep the query pending
    const handlers = {
      "auth.validateToken": () => new Promise(() => {}),
    };

    renderWithProviders(<SignupPage />, {
      initialEntries: ["/signup?token=test-token"],
      handlers,
    });

    await waitFor(() => {
      expect(getScreen().getByText("Validating Link")).not.toBeNull();
      expect(getScreen().getByText("Validating...")).not.toBeNull();
    });
  });

  test("shows Invalid Link when token validation fails", async () => {
    const handlers = {
      "auth.validateToken": () => ({ valid: false }),
    };

    renderWithProviders(<SignupPage />, {
      initialEntries: ["/signup?token=bad-token"],
      handlers,
    });

    await waitFor(() => {
      expect(getScreen().getByText("Invalid Link")).not.toBeNull();
    });
  });

  test("shows signup form when token is valid", async () => {
    const handlers = {
      "auth.validateToken": () => ({ valid: true, first_name: "John" }),
    };

    renderWithProviders(<SignupPage />, {
      initialEntries: ["/signup?token=good-token"],
      handlers,
    });

    await waitFor(() => {
      expect(getScreen().getByText("Complete Your Account")).not.toBeNull();
      expect(getScreen().getByLabelText("Username")).not.toBeNull();
      expect(getScreen().getByLabelText("Password")).not.toBeNull();
      expect(getScreen().getByLabelText("Confirm Password")).not.toBeNull();
      expect(getScreen().getByLabelText("Date of Birth")).not.toBeNull();
    });
  });

  test("shows welcome message with first name when token is valid", async () => {
    const handlers = {
      "auth.validateToken": () => ({ valid: true, first_name: "John" }),
    };

    renderWithProviders(<SignupPage />, {
      initialEntries: ["/signup?token=good-token"],
      handlers,
    });

    await waitFor(() => {
      expect(getScreen().getByText(/Welcome, John!/)).not.toBeNull();
    });
  });

  test("shows success card after successful signup", async () => {
    const handlers = {
      "auth.validateToken": () => ({ valid: true, first_name: "John" }),
      "auth.signup": () => ({ success: true }),
    };

    renderWithProviders(<SignupPage />, {
      initialEntries: ["/signup?token=good-token"],
      handlers,
    });

    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();

    // Wait for form to appear
    await waitFor(() => {
      expect(getScreen().getByText("Complete Your Account")).not.toBeNull();
    });

    await user.type(getScreen().getByLabelText("Username"), "testuser");
    await user.type(getScreen().getByLabelText("Password"), "Password1!");
    await user.type(getScreen().getByLabelText("Confirm Password"), "Password1!");
    await user.type(getScreen().getByLabelText("Date of Birth"), "1990-01-01");
    await user.click(getScreen().getByRole("button", { name: "Create Account" }));

    await waitFor(() => {
      expect(getScreen().getByText("Account Created")).not.toBeNull();
    });
  });
});
