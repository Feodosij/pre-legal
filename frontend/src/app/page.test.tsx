import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

import LoginPage from "./page";

describe("LoginPage", () => {
  it("defaults to the sign in tab", () => {
    render(<LoginPage />);
    expect(screen.getByTestId("submit-button")).toHaveTextContent("Sign in");
  });

  it("switches to the sign up tab and updates the submit label", () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByRole("button", { name: "Sign up" }));
    expect(screen.getByTestId("submit-button")).toHaveTextContent("Create account");
  });

  it("navigates to /app/ on submit without calling any API", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "whatever" },
    });
    fireEvent.click(screen.getByTestId("submit-button"));

    expect(push).toHaveBeenCalledWith("/app/");
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
