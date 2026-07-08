import type { AuthCredentials, User } from "./auth-types";

async function extractErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const body = await response.json();
    return typeof body.detail === "string" ? body.detail : fallback;
  } catch {
    return fallback;
  }
}

export async function signUp(credentials: AuthCredentials): Promise<User> {
  const response = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, "Could not create your account."));
  }
  return response.json();
}

export async function signIn(credentials: AuthCredentials): Promise<User> {
  const response = await fetch("/api/auth/signin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, "Invalid email or password."));
  }
  return response.json();
}

export async function signOut(): Promise<void> {
  await fetch("/api/auth/signout", { method: "POST" });
}

export async function getMe(): Promise<User | null> {
  const response = await fetch("/api/auth/me");
  if (response.status === 401) return null;
  if (!response.ok) throw new Error("Failed to load session.");
  return response.json();
}
