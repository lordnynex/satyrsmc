import { describe, test, expect } from "vitest";
import { render } from "@testing-library/react";
import { MissionStatement } from "./MissionStatement";

describe("MissionStatement", () => {
  test("renders heading", () => {
    const { container } = render(<MissionStatement />);
    const h2 = container.querySelector("h2");
    expect(h2).not.toBeNull();
    expect(h2!.textContent).toBe("Our Mission");
  });

  test("renders mission text", () => {
    const { container } = render(<MissionStatement />);
    expect(container.textContent).toContain("founded in 1954");
    expect(container.textContent).toContain("oldest continuously running");
  });
});
