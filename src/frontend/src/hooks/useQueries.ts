import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type {
  CoconutBatchEntryInput,
  CoconutBatchReportFilter,
  CustomerInputV2,
  HuskBatchEntryInput,
  ReportFilter,
} from "../backend";
import { useAuthContext } from "./AuthContext";
import { useActor } from "./useActor";

// ── Customers ──────────────────────────────────────────────────────────────────

export function useGetAllCustomers() {
  const { actor, isFetching } = useActor();
  const { user, pin } = useAuthContext();
  return useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      if (!actor || !user) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getAllCustomers(user.username, pin);
    },
    enabled: !!actor && !isFetching && !!user,
  });
}

export function useGetHuskCustomers() {
  const { actor, isFetching } = useActor();
  const { user, pin } = useAuthContext();
  return useQuery({
    queryKey: ["customers", "husk"],
    queryFn: async () => {
      if (!actor || !user) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getAllHuskCustomers(user.username, pin);
    },
    enabled: !!actor && !isFetching && !!user,
  });
}

export function useGetCoconutCustomers() {
  const { actor, isFetching } = useActor();
  const { user, pin } = useAuthContext();
  return useQuery({
    queryKey: ["customers", "coconut"],
    queryFn: async () => {
      if (!actor || !user) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getAllCoconutCustomers(user.username, pin);
    },
    enabled: !!actor && !isFetching && !!user,
  });
}

export function useAddCustomer() {
  const { actor } = useActor();
  const { user, pin } = useAuthContext();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CustomerInputV2) => {
      if (!actor || !user) throw new Error("No actor");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).addCustomer(user.username, pin, input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}

export function useUpdateCustomer() {
  const { actor } = useActor();
  const { user, pin } = useAuthContext();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: { id: bigint; input: CustomerInputV2 }) => {
      if (!actor || !user) throw new Error("No actor");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).updateCustomer(user.username, pin, id, input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}

export function useDeleteCustomer() {
  const { actor } = useActor();
  const { user, pin } = useAuthContext();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor || !user) throw new Error("No actor");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).deleteCustomer(user.username, pin, id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}

// ── Vehicles (backend-first) ────────────────────────────────────────────────

export function useGetAllVehicles() {
  const { actor, isFetching } = useActor();
  const { user, pin } = useAuthContext();
  return useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      if (!actor || !user) return [];
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const backend = await (actor as any).getAllVehicles(user.username, pin);
        if (Array.isArray(backend) && backend.length > 0) return backend;
        return [];
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching && !!user,
  });
}

export function useDeleteVehicle() {
  const { actor } = useActor();
  const { user, pin } = useAuthContext();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor || !user) throw new Error("No actor");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).deleteVehicle(user.username, pin, id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vehicles"] }),
  });
}

// ── Notes ──────────────────────────────────────────────────────────────────

export function useGetAllNotes() {
  const { actor, isFetching } = useActor();
  const { user, pin } = useAuthContext();
  return useQuery({
    queryKey: ["notes"],
    queryFn: async () => {
      if (!actor || !user) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getAllNotes(user.username, pin);
    },
    enabled: !!actor && !isFetching && !!user,
  });
}

export function useAddNote() {
  const { actor } = useActor();
  const { user, pin } = useAuthContext();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (content: string) => {
      if (!actor || !user) throw new Error("No actor");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).addNote(user.username, pin, content);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] }),
  });
}

// ── Legacy entries (Dashboard — reads from backend) ───────────────────────────

export function useGetAllEntries() {
  const { actor, isFetching } = useActor();
  const { user, pin } = useAuthContext();
  return useQuery({
    queryKey: ["entries"],
    queryFn: async () => {
      if (!actor || !user) return [];
      const [huskEntries, coconutEntries] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (actor as any).getAllHuskBatchEntries(user.username, pin) as Promise<
          any[]
        >,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (actor as any).getAllCoconutBatchEntries(user.username, pin) as Promise<
          any[]
        >,
      ]);
      const husk = (huskEntries ?? []).map((e: any) => ({
        id: e.id,
        customerName: e.customerName,
        vehicleNumber: e.vehicleNumber,
        createdAt: e.createdAt,
        quantity: (e.items as Array<{ quantity: bigint }>).reduce(
          (s, i) => s + i.quantity,
          0n,
        ),
        itemType:
          (e.items as Array<{ itemType: string }>)[0]?.itemType ?? "husk",
        createdByName: e.createdByName,
      }));
      const coconut = (coconutEntries ?? []).map((e: any) => ({
        id: e.id,
        customerName: e.customerName,
        vehicleNumber: e.vehicleNumber,
        createdAt: e.createdAt,
        quantity: (e.items as Array<{ quantity: bigint }>).reduce(
          (s, i) => s + i.quantity,
          0n,
        ),
        itemType: "coconut",
        createdByName: e.createdByName,
      }));
      return [...husk, ...coconut];
    },
    enabled: !!actor && !isFetching && !!user,
    staleTime: 0,
  });
}

// ── Husk Batch Entries (backend-only) ─────────────────────────────────────────

export function useGetAllHuskBatchEntries() {
  const { actor, isFetching } = useActor();
  const { user, pin } = useAuthContext();
  return useQuery({
    queryKey: ["huskBatchEntries"],
    queryFn: async () => {
      if (!actor || !user) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getAllHuskBatchEntries(user.username, pin);
    },
    enabled: !!actor && !isFetching && !!user,
    staleTime: 0,
  });
}

export function useAddHuskBatchEntry() {
  const { user, pin } = useAuthContext();
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      input,
    }: { input: HuskBatchEntryInput; entryDateMs?: number }) => {
      if (!actor || !user) throw new Error("Not logged in");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const id = await (actor as any).addHuskBatchEntry(
        user.username,
        pin,
        input,
      );
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["huskBatchEntries"] });
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      qc.invalidateQueries({ queryKey: ["entries"] });
    },
  });
}

export function useUpdateHuskBatchEntry() {
  const { user, pin } = useAuthContext();
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: { id: bigint; input: HuskBatchEntryInput }) => {
      if (!actor || !user) throw new Error("Not logged in");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).updateHuskBatchEntry(user.username, pin, id, input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["huskBatchEntries"] }),
  });
}

export function useDeleteHuskBatchEntry() {
  const { user, pin } = useAuthContext();
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor || !user) throw new Error("Not logged in");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).deleteHuskBatchEntry(user.username, pin, id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["huskBatchEntries"] }),
  });
}

export function useGetHuskBatchReport(filter: ReportFilter, enabled: boolean) {
  const { actor, isFetching } = useActor();
  const { user, pin } = useAuthContext();
  return useQuery({
    queryKey: [
      "huskBatchReport",
      JSON.stringify(filter, (_, v) =>
        typeof v === "bigint" ? v.toString() : v,
      ),
    ],
    queryFn: async () => {
      if (!actor || !user) {
        return {
          entries: [],
          totalQuantity: 0n,
          paidCount: 0n,
          pendingCount: 0n,
          totalPaymentAmount: 0n,
        };
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getHuskBatchReport(user.username, pin, filter);
    },
    enabled: enabled && !!actor && !isFetching && !!user,
    staleTime: 0,
  });
}

export function useUpdateHuskBatchPayment() {
  const { user, pin } = useAuthContext();
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      amount,
    }: {
      id: bigint;
      status: { paid: null } | { pending: null };
      amount: [] | [bigint];
    }) => {
      if (!actor || !user) throw new Error("Not logged in");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).updateHuskBatchPayment(
        user.username,
        pin,
        id,
        status,
        amount,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["huskBatchEntries"] }),
  });
}

// ── Coconut Batch Entries (backend-only) ──────────────────────────────────────

export function useGetAllCoconutBatchEntries() {
  const { actor, isFetching } = useActor();
  const { user, pin } = useAuthContext();
  return useQuery({
    queryKey: ["coconutBatchEntries"],
    queryFn: async () => {
      if (!actor || !user) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getAllCoconutBatchEntries(user.username, pin);
    },
    enabled: !!actor && !isFetching && !!user,
    staleTime: 0,
  });
}

export function useAddCoconutBatchEntry() {
  const { user, pin } = useAuthContext();
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      input,
    }: { input: CoconutBatchEntryInput; entryDateMs?: number }) => {
      if (!actor || !user) throw new Error("Not logged in");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const id = await (actor as any).addCoconutBatchEntry(
        user.username,
        pin,
        input,
      );
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["coconutBatchEntries"] });
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      qc.invalidateQueries({ queryKey: ["entries"] });
    },
  });
}

export function useUpdateCoconutBatchEntry() {
  const { user, pin } = useAuthContext();
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: { id: bigint; input: CoconutBatchEntryInput }) => {
      if (!actor || !user) throw new Error("Not logged in");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).updateCoconutBatchEntry(
        user.username,
        pin,
        id,
        input,
      );
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["coconutBatchEntries"] }),
  });
}

export function useDeleteCoconutBatchEntry() {
  const { user, pin } = useAuthContext();
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor || !user) throw new Error("Not logged in");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).deleteCoconutBatchEntry(user.username, pin, id);
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["coconutBatchEntries"] }),
  });
}

export function useGetCoconutBatchReport(
  filter: CoconutBatchReportFilter,
  enabled: boolean,
) {
  const { actor, isFetching } = useActor();
  const { user, pin } = useAuthContext();
  return useQuery({
    queryKey: [
      "coconutBatchReport",
      JSON.stringify(filter, (_, v) =>
        typeof v === "bigint" ? v.toString() : v,
      ),
    ],
    queryFn: async () => {
      if (!actor || !user) {
        return {
          entries: [],
          totalQuantity: 0n,
          paidCount: 0n,
          pendingCount: 0n,
          totalPaymentAmount: 0n,
        };
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getCoconutBatchReport(user.username, pin, filter);
    },
    enabled: enabled && !!actor && !isFetching && !!user,
    staleTime: 0,
  });
}

export function useUpdateCoconutBatchPayment() {
  const { user, pin } = useAuthContext();
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      amount,
    }: {
      id: bigint;
      status: { paid: null } | { pending: null };
      amount: [] | [bigint];
    }) => {
      if (!actor || !user) throw new Error("Not logged in");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).updateCoconutBatchPayment(
        user.username,
        pin,
        id,
        status,
        amount,
      );
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["coconutBatchEntries"] }),
  });
}

// ── Data Sync: invalidate all queries every 10 minutes ────────────────────────

/**
 * Call this once when the user logs in (or app loads with a session).
 * Forces a refetch from backend on mount and every 10 minutes so all users
 * always see the latest data.
 */
export function useDataSync() {
  const { user } = useAuthContext();
  const { actor } = useActor();
  const qc = useQueryClient();

  useEffect(() => {
    if (!actor || !user) return;

    const invalidateAll = () => {
      qc.invalidateQueries({ queryKey: ["huskBatchEntries"] });
      qc.invalidateQueries({ queryKey: ["coconutBatchEntries"] });
      qc.invalidateQueries({ queryKey: ["entries"] });
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["vehicles"] });
    };

    // Invalidate immediately on mount / login
    invalidateAll();

    // Poll every 10 minutes for updates from other users
    const interval = setInterval(invalidateAll, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [actor, user, qc]);
}
