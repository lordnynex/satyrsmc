import { describe, test, expect } from "bun:test";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import BadgerPage from "./BadgerPage";

describe("BadgerPage", () => {
  test("renders hero with title", () => {
    const { container } = render(
      <MemoryRouter>
        <BadgerPage />
      </MemoryRouter>,
    );
    const h1 = container.querySelector("h1");
    expect(h1).not.toBeNull();
    expect(h1!.textContent).toBe("Badger");
  });

  test("renders badger program description", () => {
    const { container } = render(
      <MemoryRouter>
        <BadgerPage />
      </MemoryRouter>,
    );
    expect(container.textContent).toContain("Badger program");
  });

  test("renders application link", () => {
    const { container } = render(
      <MemoryRouter>
        <BadgerPage />
      </MemoryRouter>,
    );
    const link = container.querySelector('a[href*="BadgerApplication"]');
    expect(link).not.toBeNull();
    expect(link!.textContent).toContain("Badger Application");
  });
});
