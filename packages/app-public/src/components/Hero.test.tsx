import { describe, test, expect } from "bun:test";
import { render } from "@testing-library/react";
import { Hero } from "./Hero";

describe("Hero", () => {
  test("renders title", () => {
    const { container } = render(<Hero title="Test Title" />);
    const h1 = container.querySelector("h1");
    expect(h1).not.toBeNull();
    expect(h1!.textContent).toBe("Test Title");
  });

  test("renders subtitle when provided", () => {
    const { container } = render(<Hero title="Title" subtitle="A subtitle" />);
    const p = container.querySelector("p");
    expect(p).not.toBeNull();
    expect(p!.textContent).toBe("A subtitle");
  });

  test("does not render subtitle when omitted", () => {
    const { container } = render(<Hero title="Title Only" />);
    const p = container.querySelector("p");
    expect(p).toBeNull();
  });
});
