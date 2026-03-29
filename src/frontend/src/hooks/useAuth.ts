import { useState } from "react";
import { useActor } from "./useActor";

export interface AppUser {
  username: string;
  name: string;
  role: "admin" | "staff";
}

export function isAdmin(user: AppUser | null): boolean {
  return user?.role === "admin";
}

export function isStaff(user: AppUser | null): boolean {
  return user?.role === "staff" || user?.role === "admin";
}

// ── Local credential store ────────────────────────────────────────────────────
// Structure: { [username]: { pin, name, role } }
const LOCAL_USERS_KEY = "acw_local_users";
const DEFAULT_ADMIN = { pin: "265286", name: "Admin", role: "admin" as const };

export function getLocalUsers(): Record<
  string,
  { pin: string; name: string; role: "admin" | "staff" }
> {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    // Always ensure the default admin exists
    if (!parsed.Admin) {
      parsed.Admin = DEFAULT_ADMIN;
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(parsed));
    }
    // Migrate any existing driver roles to staff
    let changed = false;
    for (const key of Object.keys(parsed)) {
      if (parsed[key].role === "driver") {
        parsed[key].role = "staff";
        changed = true;
      }
    }
    if (changed) localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(parsed));
    return parsed;
  } catch {
    const fallback = { Admin: DEFAULT_ADMIN };
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(fallback));
    return fallback;
  }
}

function saveLocalUsers(
  users: Record<string, { pin: string; name: string; role: "admin" | "staff" }>,
) {
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
}

export function addLocalUser(
  username: string,
  pin: string,
  name: string,
  role: "admin" | "staff",
) {
  const users = getLocalUsers();
  users[username] = { pin, name, role };
  saveLocalUsers(users);
}

export function updateLocalUserRole(username: string, role: "admin" | "staff") {
  const users = getLocalUsers();
  if (users[username]) {
    users[username].role = role;
    saveLocalUsers(users);
  }
}

export function updateLocalUserPin(username: string, newPin: string) {
  const users = getLocalUsers();
  if (users[username]) {
    users[username].pin = newPin;
    saveLocalUsers(users);
  }
}

export function verifyLocalPin(username: string, pin: string): boolean {
  const users = getLocalUsers();
  return users[username]?.pin === pin;
}

export function deleteLocalUser(username: string) {
  const users = getLocalUsers();
  delete users[username];
  saveLocalUsers(users);
}

export function listLocalUsers(): Array<{
  username: string;
  name: string;
  role: "admin" | "staff";
}> {
  const users = getLocalUsers();
  return Object.entries(users).map(([username, data]) => ({
    username,
    name: data.name,
    role: data.role,
  }));
}

function checkLocalCredentials(username: string, pin: string): AppUser | null {
  const users = getLocalUsers();
  const entry = users[username];
  if (!entry) return null;
  if (entry.pin !== pin) return null;
  return { username, name: entry.name, role: entry.role };
}

// ── Session storage ───────────────────────────────────────────────────────────
function readStored(): { user: AppUser | null; pin: string } {
  try {
    const raw = localStorage.getItem("acw_user");
    const pin = localStorage.getItem("acw_pin") ?? "";
    if (raw) {
      const parsed = JSON.parse(raw) as AppUser;
      // Migrate driver to staff
      if ((parsed.role as string) === "driver") parsed.role = "staff";
      return { user: parsed, pin };
    }
  } catch {
    // ignore
  }
  return { user: null, pin: "" };
}

function roleFromBackend(role: unknown): "admin" | "staff" {
  if (role && typeof role === "object") {
    if ("admin" in role) return "admin";
  }
  return "staff";
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useAuth() {
  const { actor } = useActor();
  const stored = readStored();
  const [user, setUser] = useState<AppUser | null>(stored.user);
  const [pin, setPin] = useState<string>(stored.pin);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (username: string, inputPin: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Step 1: check local credential store first (instant, no network needed)
      const localUser = checkLocalCredentials(username, inputPin);
      if (localUser) {
        localStorage.setItem("acw_user", JSON.stringify(localUser));
        localStorage.setItem("acw_pin", inputPin);
        setUser(localUser);
        setPin(inputPin);
        // Step 2: sync with backend in background (non-blocking)
        if (actor) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = await (actor as any).loginUser(username, inputPin);
            if (result && result.length > 0 && result[0]) {
              const r = result[0];
              const synced: AppUser = {
                username: r.username,
                name: r.name,
                role: roleFromBackend(r.role),
              };
              // Sync role from backend (source of truth for roles)
              localStorage.setItem("acw_user", JSON.stringify(synced));
              setUser(synced);
              // Update local store to match backend role
              updateLocalUserRole(username, synced.role);
            }
          } catch {
            // Backend sync failed, local login already succeeded — that's fine
          }
        }
        return;
      }

      // Step 2: fall back to backend if not in local store
      if (!actor) {
        setError("Cannot connect to server. Please try again.");
        throw new Error("Actor not ready");
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (actor as any).loginUser(username, inputPin);
      if (result && result.length > 0 && result[0]) {
        const r = result[0];
        const appUser: AppUser = {
          username: r.username,
          name: r.name,
          role: roleFromBackend(r.role),
        };
        // Save to local store for future offline login
        addLocalUser(username, inputPin, appUser.name, appUser.role);
        localStorage.setItem("acw_user", JSON.stringify(appUser));
        localStorage.setItem("acw_pin", inputPin);
        setUser(appUser);
        setPin(inputPin);
      } else {
        setError("Invalid username or PIN");
        throw new Error("Invalid username or PIN");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("acw_user");
    localStorage.removeItem("acw_pin");
    setUser(null);
    setPin("");
    window.location.reload();
  };

  const updateStoredPin = (newPin: string) => {
    localStorage.setItem("acw_pin", newPin);
    setPin(newPin);
    // Also update local store
    if (user) updateLocalUserPin(user.username, newPin);
  };

  return { user, pin, login, logout, isLoading, error, updateStoredPin };
}
