import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

const signIn = vi.fn();
const signUp = vi.fn();
let mockUser: { id: number; email: string; created_at: string } | null = null;

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: mockUser,
    isLoading: false,
    signIn,
    signUp,
    signOut: vi.fn(),
  }),
}));

import LoginPage from "./page";

describe("LoginPage", () => {
  afterEach(() => {
    push.mockReset();
    signIn.mockReset();
    signUp.mockReset();
    mockUser = null;
  });

  it("defaults to the sign in tab", () => {
    render(<LoginPage />);
    expect(screen.getByTestId("submit-button")).toHaveTextContent("Sign in");
  });

  it("switches to the sign up tab and updates the submit label", () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByRole("button", { name: "Sign up" }));
    expect(screen.getByTestId("submit-button")).toHaveTextContent("Create account");
  });

  it("signs in against the backend and navigates to /app/ on success", async () => {
    signIn.mockResolvedValueOnce(undefined);
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "supersecret" },
    });
    fireEvent.click(screen.getByTestId("submit-button"));

    await waitFor(() => expect(signIn).toHaveBeenCalledWith("user@example.com", "supersecret"));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/app/"));
  });

  it("signs up against the backend when on the sign up tab", async () => {
    signUp.mockResolvedValueOnce(undefined);
    render(<LoginPage />);
    fireEvent.click(screen.getByRole("button", { name: "Sign up" }));

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "new@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "supersecret" },
    });
    fireEvent.click(screen.getByTestId("submit-button"));

    await waitFor(() => expect(signUp).toHaveBeenCalledWith("new@example.com", "supersecret"));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/app/"));
  });

  it("shows an error message and does not navigate when sign in fails", async () => {
    signIn.mockRejectedValueOnce(new Error("Invalid email or password."));
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "wrong" },
    });
    fireEvent.click(screen.getByTestId("submit-button"));

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid email or password.");
    expect(push).not.toHaveBeenCalled();
  });
});
