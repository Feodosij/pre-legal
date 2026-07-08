import { afterEach, describe, expect, it, vi } from "vitest";
import { getMe, signIn, signOut, signUp } from "./auth-client";

describe("auth-client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts credentials to /api/auth/signup and returns the created user", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 1, email: "user@example.com", created_at: "2024-01-01" }),
    });
    vi.stubGlobal("fetch", fetchSpy);

    const user = await signUp({ email: "user@example.com", password: "supersecret" });

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/auth/signup",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "user@example.com", password: "supersecret" }),
      })
    );
    expect(user.email).toBe("user@example.com");
  });

  it("throws the backend's detail message when signin fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ detail: "Invalid email or password." }),
      })
    );

    await expect(signIn({ email: "user@example.com", password: "wrong" })).rejects.toThrow(
      "Invalid email or password."
    );
  });

  it("returns null from getMe when unauthenticated", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401 }));
    expect(await getMe()).toBeNull();
  });

  it("returns the user from getMe when authenticated", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ id: 1, email: "user@example.com", created_at: "2024-01-01" }),
      })
    );
    const user = await getMe();
    expect(user?.email).toBe("user@example.com");
  });

  it("posts to /api/auth/signout", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchSpy);

    await signOut();

    expect(fetchSpy).toHaveBeenCalledWith("/api/auth/signout", { method: "POST" });
  });
});
