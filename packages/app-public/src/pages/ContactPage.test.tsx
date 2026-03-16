import { describe, test, expect } from "bun:test";
import { within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/renderWithProviders";
import ContactPage from "./ContactPage";

describe("ContactPage", () => {
  test("renders hero and mailing address", () => {
    renderWithProviders(<ContactPage />);
    const screen = within(document.body);
    expect(screen.getByText("Contact Us")).not.toBeNull();
    expect(screen.getByText(/mailing address/i)).not.toBeNull();
  });

  test("renders all form fields", () => {
    renderWithProviders(<ContactPage />);
    const screen = within(document.body);
    expect(screen.getByLabelText(/name/i)).not.toBeNull();
    expect(screen.getByLabelText(/email/i)).not.toBeNull();
    expect(screen.getByLabelText(/subject/i)).not.toBeNull();
    expect(screen.getByLabelText(/message/i)).not.toBeNull();
    expect(screen.getByText("Send Message")).not.toBeNull();
  });

  test("shows validation errors on empty submit", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ContactPage />);
    const screen = within(document.body);

    await user.click(screen.getByText("Send Message"));

    await waitFor(() => {
      expect(screen.getByText("Name is required")).not.toBeNull();
      expect(screen.getByText("Message is required")).not.toBeNull();
    });
  });

  test("shows email validation error for invalid email", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ContactPage />);
    const screen = within(document.body);

    await user.type(screen.getByLabelText(/name/i), "Test");
    // Use clear + type to set an invalid email value
    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    await user.type(emailInput, "not-an-email");
    await user.type(screen.getByLabelText(/message/i), "Hello");

    // Submit the form programmatically to bypass browser validation
    const form = document.querySelector("form");
    form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

    await waitFor(() => {
      expect(screen.getByText("Please enter a valid email address")).not.toBeNull();
    });
  });

  test("shows success message after submission", async () => {
    const user = userEvent.setup();
    const handlers = {
      "website.submitContact": () => ({ id: "c1", created: true }),
    };

    renderWithProviders(<ContactPage />, { handlers });
    const screen = within(document.body);

    await user.type(screen.getByLabelText(/name/i), "Jane Doe");
    await user.type(screen.getByLabelText(/email/i), "jane@example.com");
    await user.type(screen.getByLabelText(/message/i), "Hello there");

    await user.click(screen.getByText("Send Message"));

    await waitFor(() => {
      expect(screen.getByText("Thank you for your message!")).not.toBeNull();
    });
  });

  test("submit button shows loading state", async () => {
    const user = userEvent.setup();
    const handlers = {
      "website.submitContact": () => ({ id: "c1", created: true }),
    };

    renderWithProviders(<ContactPage />, { handlers });
    const screen = within(document.body);

    await user.type(screen.getByLabelText(/name/i), "Jane");
    await user.type(screen.getByLabelText(/email/i), "j@example.com");
    await user.type(screen.getByLabelText(/message/i), "Hi");

    const button = screen.getByText("Send Message") as HTMLButtonElement;
    expect(button.disabled).toBe(false);
  });
});
