import { Actor, HttpAgent } from "@icp-sdk/core/agent";
import { useMemo } from "react";
import { idlFactory } from "../declarations/backend.did";

// Canister ID is injected by vite-plugin-environment from DFX env vars
declare const CANISTER_ID_BACKEND: string | undefined;

function getBackendCanisterId(): string {
  // Injected at build time by vite-plugin-environment
  try {
    if (typeof CANISTER_ID_BACKEND !== "undefined" && CANISTER_ID_BACKEND) {
      return CANISTER_ID_BACKEND;
    }
  } catch {
    // ignore
  }
  // Fallback: check window-level env (dev proxy)
  const win = window as Window & { _CANISTER_ID_BACKEND?: string };
  return win._CANISTER_ID_BACKEND ?? "";
}

function getHost(): string {
  try {
    if (
      typeof process !== "undefined" &&
      process.env?.DFX_NETWORK === "local"
    ) {
      return "http://localhost:4943";
    }
  } catch {
    // ignore
  }
  // Default to IC mainnet
  return "https://ic0.app";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ActorInstance = any;

let cachedActor: ActorInstance | null = null;

function createBackendActor(): ActorInstance | null {
  try {
    const canisterId = getBackendCanisterId();
    if (!canisterId) return null;

    const host = getHost();
    const agent = new HttpAgent({ host });

    // Fetch root key in local dev (don't await — non-blocking)
    if (host.includes("localhost") || host.includes("127.0.0.1")) {
      agent.fetchRootKey().catch(() => {
        // Ignore — dev environment may not have it yet
      });
    }

    const actor = Actor.createActor(idlFactory, {
      agent,
      canisterId,
    });

    return actor;
  } catch {
    return null;
  }
}

/**
 * Returns the IC actor connected to the backend canister.
 * Returns { actor, isFetching } — actor may be null if canister ID is not set.
 */
export function useActor(): {
  actor: ActorInstance | null;
  isFetching: boolean;
} {
  const actor = useMemo(() => {
    if (cachedActor) return cachedActor;
    const a = createBackendActor();
    if (a) cachedActor = a;
    return a;
  }, []);

  return { actor, isFetching: false };
}
