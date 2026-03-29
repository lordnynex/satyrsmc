import { describe, test, expect } from "vitest";
import { within } from "@testing-library/react";
import { renderWithProviders } from "../test/renderWithProviders";
import MembersPage from "./MembersPage";

describe("MembersPage", () => {
  test("renders hero with title", () => {
    renderWithProviders(<MembersPage />);
    const screen = within(document.body);
    expect(screen.getByText("Club Members")).not.toBeNull();
  });

  test("renders officers section", () => {
    renderWithProviders(<MembersPage />);
    const screen = within(document.body);
    expect(screen.getByText("Officers")).not.toBeNull();
  });

  test("renders member names from static data", () => {
    renderWithProviders(<MembersPage />);
    const screen = within(document.body);
    expect(screen.getByText("Brandon Beveridge")).not.toBeNull();
  });
});
