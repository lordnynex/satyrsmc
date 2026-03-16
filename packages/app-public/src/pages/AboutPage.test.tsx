import { describe, test, expect } from "bun:test";
import { within } from "@testing-library/react";
import { renderWithProviders } from "../test/renderWithProviders";
import AboutPage from "./AboutPage";

describe("AboutPage", () => {
  test("renders hero with title", () => {
    renderWithProviders(<AboutPage />);
    const screen = within(document.body);
    expect(screen.getByText("About the Satyrs M/C")).not.toBeNull();
  });

  test("renders history section", () => {
    renderWithProviders(<AboutPage />);
    const screen = within(document.body);
    expect(screen.getByText("Our History")).not.toBeNull();
    expect(document.body.textContent).toContain("Formed in 1954");
  });

  test("renders sub-navigation buttons", () => {
    renderWithProviders(<AboutPage />);
    const screen = within(document.body);
    expect(screen.getByText("History")).not.toBeNull();
    const timelineButtons = screen.getAllByText("Timeline & Archives");
    expect(timelineButtons.length).toBeGreaterThanOrEqual(1);
  });
});
