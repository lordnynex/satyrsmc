import { describe, test, expect } from "vitest";
import { render } from "@testing-library/react";
import { SafeHtml } from "./SafeHtml";

describe("SafeHtml", () => {
  test("renders sanitized HTML", () => {
    const { container } = render(<SafeHtml html="<p>Hello <strong>world</strong></p>" />);
    const p = container.querySelector("p");
    expect(p).not.toBeNull();
    expect(p!.innerHTML).toBe("Hello <strong>world</strong>");
  });

  test("strips script tags", () => {
    const { container } = render(<SafeHtml html='<p>Safe</p><script>alert("xss")</script>' />);
    expect(container.innerHTML).not.toContain("script");
    expect(container.textContent).toContain("Safe");
  });

  test("strips onclick attributes", () => {
    const { container } = render(<SafeHtml html='<button onclick="alert(1)">Click</button>' />);
    const button = container.querySelector("button");
    expect(button).not.toBeNull();
    expect(button!.getAttribute("onclick")).toBeNull();
  });

  test("passes className through", () => {
    const { container } = render(<SafeHtml html="<p>test</p>" className="prose mt-4" />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toBe("prose mt-4");
  });

  test("renders empty string without error", () => {
    const { container } = render(<SafeHtml html="" />);
    expect(container.firstElementChild).not.toBeNull();
    expect(container.textContent).toBe("");
  });
});
