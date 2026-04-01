import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CoconutBatchEntryInput,
  CoconutBatchReportFilter,
  CustomerInput,
  HuskBatchEntryInput,
  ReportFilter,
} from "../backend";
import { useAuthContext } from "./AuthContext";
import { useActor } from "./useActor";

// ─── Customers ────────────────────────────────────────────────────────────────

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

// ─── Vehicles ─────────────────────────────────────────────────────────────────

export function useGetAllVehicles() {
  const { actor, isFetching } = useActor();
  const { user, pin } = useAuthContext();
  return useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      if (!actor || !user) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getAllVehicles(user.username, pin);
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

// ─── Notes ────────────────────────────────────────────────────────────────────

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

// ─── Legacy entries (used by Dashboard) ───────────────────────────────────────

export function useGetAllEntries() {
  const { actor, isFetching } = useActor();
  const { user } = useAuthContext();
  return useQuery({
    queryKey: ["entries"],
    queryFn: async () => {
      if (!actor) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getAllEntries();
    },
    enabled: !!actor && !isFetching && !!user,
  });
}

// ─── Husk Batch Entries ───────────────────────────────────────────────────────

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
  });
}

export function useAddHuskBatchEntry() {
  const { actor } = useActor();
  const { user, pin } = useAuthContext();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: HuskBatchEntryInput) => {
      if (!actor || !user) throw new Error("No actor");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).addHuskBatchEntry(user.username, pin, input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["huskBatchEntries"] });
      qc.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });
}

export function useUpdateHuskBatchEntry() {
  const { actor } = useActor();
  const { user, pin } = useAuthContext();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: { id: bigint; input: HuskBatchEntryInput }) => {
      if (!actor || !user) throw new Error("No actor");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).updateHuskBatchEntry(user.username, pin, id, input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["huskBatchEntries"] }),
  });
}

export function useDeleteHuskBatchEntry() {
  const { actor } = useActor();
  const { user, pin } = useAuthContext();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor || !user) throw new Error("No actor");
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
      if (!actor || !user) throw new Error("No actor");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getHuskBatchReport(user.username, pin, filter);
    },
    enabled: !!actor && !isFetching && !!user && enabled,
  });
}

export function useUpdateHuskBatchPayment() {
  const { actor } = useActor();
  const { user, pin } = useAuthContext();
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
      if (!actor || !user) throw new Error("No actor");
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

// ─── Coconut Batch Entries ────────────────────────────────────────────────────

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
  });
}

export function useAddCoconutBatchEntry() {
  const { actor } = useActor();
  const { user, pin } = useAuthContext();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CoconutBatchEntryInput) => {
      if (!actor || !user) throw new Error("No actor");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).addCoconutBatchEntry(user.username, pin, input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["coconutBatchEntries"] });
      qc.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });
}

export function useUpdateCoconutBatchEntry() {
  const { actor } = useActor();
  const { user, pin } = useAuthContext();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: { id: bigint; input: CoconutBatchEntryInput }) => {
      if (!actor || !user) throw new Error("No actor");
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
  const { actor } = useActor();
  const { user, pin } = useAuthContext();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor || !user) throw new Error("No actor");
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
      if (!actor || !user) throw new Error("No actor");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getCoconutBatchReport(user.username, pin, filter);
    },
    enabled: !!actor && !isFetching && !!user && enabled,
  });
}

export function useUpdateCoconutBatchPayment() {
  const { actor } = useActor();
  const { user, pin } = useAuthContext();
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
      if (!actor || !user) throw new Error("No actor");
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
