import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type {
  CoconutBatchEntryInput,
  CoconutBatchReportFilter,
  CustomerInput,
  HuskBatchEntryInput,
  ReportFilter,
} from "../backend";
import {
  pullLatest,
  pushCoconutEntry,
  pushHuskEntry,
} from "../utils/syncService";
import { useAuthContext } from "./AuthContext";
import { useActor } from "./useActor";
import {
  addLocalCoconutEntry,
  addLocalHuskEntry,
  deleteLocalCoconutEntry,
  deleteLocalHuskEntry,
  getAllLocalCoconutEntries,
  getAllLocalHuskEntries,
  getLocalVehicles,
  updateLocalCoconutEntry,
  updateLocalCoconutPayment,
  updateLocalHuskEntry,
  updateLocalHuskPayment,
} from "./useLocalEntries";

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
    mutationFn: async (input: CustomerInput) => {
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
    mutationFn: async ({ id, input }: { id: bigint; input: CustomerInput }) => {
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

// ── Vehicles (backend + local fallback) ────────────────────────────────────────

export function useGetAllVehicles() {
  const { actor, isFetching } = useActor();
  const { user, pin } = useAuthContext();
  return useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const local = getLocalVehicles();
      if (!actor || !user) return local.length > 0 ? local : [];
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const backend = await (actor as any).getAllVehicles(user.username, pin);
        if (Array.isArray(backend) && backend.length > 0) return backend;
        return local;
      } catch {
        return local;
      }
    },
    enabled: !isFetching,
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

// ── Legacy entries (Dashboard — reads from local store) ───────────────────────

export function useGetAllEntries() {
  return useQuery({
    queryKey: ["entries"],
    queryFn: () => {
      const husk = getAllLocalHuskEntries().map((e) => ({
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
      const coconut = getAllLocalCoconutEntries().map((e) => ({
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
    staleTime: 0,
  });
}

// ── Husk Batch Entries (offline-first localStorage) ───────────────────────────

export function useGetAllHuskBatchEntries() {
  return useQuery({
    queryKey: ["huskBatchEntries"],
    queryFn: () => getAllLocalHuskEntries(),
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
      entryDateMs,
    }: { input: HuskBatchEntryInput; entryDateMs?: number }) => {
      if (!user) throw new Error("Not logged in");
      const saved = addLocalHuskEntry(input, entryDateMs);
      // Push to backend immediately (fire-and-forget) so other users see it
      if (actor) {
        pushHuskEntry(actor, user.username, pin, Number(saved.id))
          .then(() => {
            qc.invalidateQueries({ queryKey: ["huskBatchEntries"] });
            qc.invalidateQueries({ queryKey: ["entries"] });
          })
          .catch(() => {
            /* will sync later */
          });
      }
      return saved;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["huskBatchEntries"] });
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      qc.invalidateQueries({ queryKey: ["entries"] });
    },
  });
}

export function useUpdateHuskBatchEntry() {
  const { user } = useAuthContext();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: { id: bigint; input: HuskBatchEntryInput }) => {
      if (!user) throw new Error("Not logged in");
      updateLocalHuskEntry(id, input, user.username);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["huskBatchEntries"] }),
  });
}

export function useDeleteHuskBatchEntry() {
  const { user } = useAuthContext();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!user) throw new Error("Not logged in");
      deleteLocalHuskEntry(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["huskBatchEntries"] }),
  });
}

export function useGetHuskBatchReport(filter: ReportFilter, enabled: boolean) {
  return useQuery({
    queryKey: [
      "huskBatchReport",
      JSON.stringify(filter, (_, v) =>
        typeof v === "bigint" ? v.toString() : v,
      ),
    ],
    queryFn: () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = filter as any;
      const entries = getAllLocalHuskEntries();
      const filtered = entries.filter((e) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const entry = e as any;
        if (f.startDate !== undefined && entry.createdAt < f.startDate)
          return false;
        if (f.endDate !== undefined && entry.createdAt > f.endDate)
          return false;
        if (f.customerId !== undefined && entry.customerId !== f.customerId)
          return false;
        if (
          f.vehicleNumber !== undefined &&
          !entry.vehicleNumber
            .toLowerCase()
            .includes(f.vehicleNumber.toLowerCase())
        )
          return false;
        if (f.itemType !== undefined) {
          const hasType = (entry.items as Array<{ itemType: string }>).some(
            (i) => i.itemType === f.itemType,
          );
          if (!hasType) return false;
        }
        if (
          f.paymentStatus !== undefined &&
          Array.isArray(f.paymentStatus) &&
          f.paymentStatus.length > 0
        ) {
          const wantPaid = "paid" in f.paymentStatus[0];
          const isPaid = entry.paymentStatus && "paid" in entry.paymentStatus;
          if (wantPaid !== isPaid) return false;
        }
        return true;
      });
      const totalQuantity = filtered.reduce(
        (s, e) =>
          s +
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ((e as any).items as Array<{ quantity: bigint }>).reduce(
            (si, i) => si + i.quantity,
            0n,
          ),
        0n,
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const paidEntries = filtered.filter(
        (e) => (e as any).paymentStatus && "paid" in (e as any).paymentStatus,
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pendingEntries = filtered.filter(
        (e) =>
          !(e as any).paymentStatus || "pending" in (e as any).paymentStatus,
      );
      const totalPaymentAmount = paidEntries.reduce(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (s, e) =>
          s +
          ((e as any).paymentAmount?.length > 0
            ? (e as any).paymentAmount[0]
            : 0n),
        0n,
      );
      return {
        entries: filtered,
        totalQuantity,
        paidCount: BigInt(paidEntries.length),
        pendingCount: BigInt(pendingEntries.length),
        totalPaymentAmount,
      };
    },
    enabled,
    staleTime: 0,
  });
}

export function useUpdateHuskBatchPayment() {
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
      updateLocalHuskPayment(id, status, amount);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["huskBatchEntries"] }),
  });
}

// ── Coconut Batch Entries (offline-first localStorage) ───────────────────────

export function useGetAllCoconutBatchEntries() {
  return useQuery({
    queryKey: ["coconutBatchEntries"],
    queryFn: () => getAllLocalCoconutEntries(),
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
      entryDateMs,
    }: { input: CoconutBatchEntryInput; entryDateMs?: number }) => {
      if (!user) throw new Error("Not logged in");
      const saved = addLocalCoconutEntry(input, entryDateMs);
      // Push to backend immediately (fire-and-forget) so other users see it
      if (actor) {
        pushCoconutEntry(actor, user.username, pin, Number(saved.id))
          .then(() => {
            qc.invalidateQueries({ queryKey: ["coconutBatchEntries"] });
            qc.invalidateQueries({ queryKey: ["entries"] });
          })
          .catch(() => {
            /* will sync later */
          });
      }
      return saved;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["coconutBatchEntries"] });
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      qc.invalidateQueries({ queryKey: ["entries"] });
    },
  });
}

export function useUpdateCoconutBatchEntry() {
  const { user } = useAuthContext();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: { id: bigint; input: CoconutBatchEntryInput }) => {
      if (!user) throw new Error("Not logged in");
      updateLocalCoconutEntry(id, input, user.username);
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["coconutBatchEntries"] }),
  });
}

export function useDeleteCoconutBatchEntry() {
  const { user } = useAuthContext();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!user) throw new Error("Not logged in");
      deleteLocalCoconutEntry(id);
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["coconutBatchEntries"] }),
  });
}

export function useGetCoconutBatchReport(
  filter: CoconutBatchReportFilter,
  enabled: boolean,
) {
  return useQuery({
    queryKey: [
      "coconutBatchReport",
      JSON.stringify(filter, (_, v) =>
        typeof v === "bigint" ? v.toString() : v,
      ),
    ],
    queryFn: () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = filter as any;
      const entries = getAllLocalCoconutEntries();
      const filtered = entries.filter((e) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const entry = e as any;
        if (f.startDate !== undefined && entry.createdAt < f.startDate)
          return false;
        if (f.endDate !== undefined && entry.createdAt > f.endDate)
          return false;
        if (f.customerId !== undefined && entry.customerId !== f.customerId)
          return false;
        if (
          f.vehicleNumber !== undefined &&
          !entry.vehicleNumber
            .toLowerCase()
            .includes(f.vehicleNumber.toLowerCase())
        )
          return false;
        if (f.coconutType !== undefined) {
          const hasType = (entry.items as Array<{ coconutType: string }>).some(
            (i) => i.coconutType === f.coconutType,
          );
          if (!hasType) return false;
        }
        if (
          f.paymentStatus !== undefined &&
          Array.isArray(f.paymentStatus) &&
          f.paymentStatus.length > 0
        ) {
          const wantPaid = "paid" in f.paymentStatus[0];
          const isPaid = entry.paymentStatus && "paid" in entry.paymentStatus;
          if (wantPaid !== isPaid) return false;
        }
        return true;
      });
      const totalQuantity = filtered.reduce(
        (s, e) =>
          s +
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ((e as any).items as Array<{ quantity: bigint }>).reduce(
            (si, i) => si + i.quantity,
            0n,
          ),
        0n,
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const paidEntries = filtered.filter(
        (e) => (e as any).paymentStatus && "paid" in (e as any).paymentStatus,
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pendingEntries = filtered.filter(
        (e) =>
          !(e as any).paymentStatus || "pending" in (e as any).paymentStatus,
      );
      const totalPaymentAmount = paidEntries.reduce(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (s, e) =>
          s +
          ((e as any).paymentAmount?.length > 0
            ? (e as any).paymentAmount[0]
            : 0n),
        0n,
      );
      return {
        entries: filtered,
        totalQuantity,
        paidCount: BigInt(paidEntries.length),
        pendingCount: BigInt(pendingEntries.length),
        totalPaymentAmount,
      };
    },
    enabled,
    staleTime: 0,
  });
}

export function useUpdateCoconutBatchPayment() {
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
      updateLocalCoconutPayment(id, status, amount);
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["coconutBatchEntries"] }),
  });
}

// ── Data Sync: pull fresh data from backend on load and every 10 minutes ──────

/**
 * Call this once when the user logs in (or app loads with a session).
 * Pulls all backend data into local storage so the UI is up-to-date.
 * Also polls every 10 minutes so changes from other users appear automatically.
 */
export function useDataSync() {
  const { user, pin } = useAuthContext();
  const { actor } = useActor();
  const qc = useQueryClient();

  useEffect(() => {
    if (!actor || !user) return;

    const doSync = async () => {
      try {
        await pullLatest(actor, user.username, pin);
        qc.invalidateQueries({ queryKey: ["huskBatchEntries"] });
        qc.invalidateQueries({ queryKey: ["coconutBatchEntries"] });
        qc.invalidateQueries({ queryKey: ["entries"] });
        qc.invalidateQueries({ queryKey: ["customers"] });
        qc.invalidateQueries({ queryKey: ["vehicles"] });
      } catch {
        /* ignore errors — offline or network issue */
      }
    };

    // Pull immediately on mount / login
    doSync();

    // Poll every 10 minutes for updates from other users
    const interval = setInterval(doSync, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [actor, user, pin, qc]);
}
