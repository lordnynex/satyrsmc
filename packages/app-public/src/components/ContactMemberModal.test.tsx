import { describe, test, expect } from "vitest";
import { within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/renderWithProviders";
import { ContactMemberModal } from "./ContactMemberModal";

describe("ContactMemberModal", () => {
  const defaultProps = {
    memberId: "m1",
    memberName: "John Doe",
    onClose: () => {},
  };

  test("renders dialog with member name", () => {
    renderWithProviders(<ContactMemberModal {...defaultProps} />);
    const screen = within(document.body);
    expect(screen.getByText("Contact John Doe")).not.toBeNull();
  });

  test("renders form fields", () => {
    renderWithProviders(<ContactMemberModal {...defaultProps} />);
    const screen = within(document.body);
    expect(screen.getByLabelText(/your name/i)).not.toBeNull();
    expect(screen.getByLabelText(/your email/i)).not.toBeNull();
    expect(screen.getByLabelText(/message/i)).not.toBeNull();
  });

  test("shows validation errors on empty submit", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ContactMemberModal {...defaultProps} />);
    const screen = within(document.body);

    await user.click(screen.getByText("Send Message"));

    await waitFor(() => {
      expect(screen.getByText("Name is required")).not.toBeNull();
      expect(screen.getByText("Message is required")).not.toBeNull();
    });
  });

  test("shows success message after submission", async () => {
    const user = userEvent.setup();
    const handlers = {
      "website.submitContactMember": () => ({ id: "sub1", created: true }),
    };

    renderWithProviders(<ContactMemberModal {...defaultProps} />, { handlers });
    const screen = within(document.body);

    await user.type(screen.getByLabelText(/your name/i), "Jane");
    await user.type(screen.getByLabelText(/your email/i), "jane@example.com");
    await user.type(screen.getByLabelText(/message/i), "Hello there");

    await user.click(screen.getByText("Send Message"));

    await waitFor(() => {
      expect(screen.getByText("Message sent!")).not.toBeNull();
    });
  });

  test("close button has accessible label", () => {
    renderWithProviders(<ContactMemberModal {...defaultProps} />);
    const screen = within(document.body);
    expect(screen.getByLabelText("Close")).not.toBeNull();
  });
});
