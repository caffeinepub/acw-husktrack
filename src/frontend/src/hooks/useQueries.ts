import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CoconutBatchEntryInput,
  CoconutBatchReportFilter,
  CoconutEntryInput,
  CustomerInput,
  HuskBatchEntryInput,
  HuskEntryInput,
  ReportFilter,
  UserProfile,
} from "../backend";
import { useActor } from "./useActor";

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useGetCallerRole() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["callerRole"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllCustomers() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllCustomers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllEntries() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["entries"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllEntries();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllVehicles() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllVehicles();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllNotes() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["notes"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllNotes();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddEntry() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: HuskEntryInput) => {
      if (!actor) throw new Error("No actor");
      return actor.addEntry(input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["entries"] });
      qc.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });
}

export function useUpdateEntry() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: { id: bigint; input: HuskEntryInput }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateEntry(id, input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["entries"] }),
  });
}

export function useDeleteEntry() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteEntry(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["entries"] }),
  });
}

export function useGetAllCoconutEntries() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["coconutEntries"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllCoconutEntries();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddCoconutEntry() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CoconutEntryInput) => {
      if (!actor) throw new Error("No actor");
      return actor.addCoconutEntry(input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["coconutEntries"] });
      qc.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });
}

export function useUpdateCoconutEntry() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: { id: bigint; input: CoconutEntryInput }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateCoconutEntry(id, input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coconutEntries"] }),
  });
}

export function useDeleteCoconutEntry() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteCoconutEntry(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coconutEntries"] }),
  });
}

export function useGetCoconutReport(
  filter: CoconutBatchReportFilter,
  enabled: boolean,
) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: [
      "coconutReport",
      JSON.stringify(filter, (_, v) =>
        typeof v === "bigint" ? v.toString() : v,
      ),
    ],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.getCoconutReport(filter);
    },
    enabled: !!actor && !isFetching && enabled,
  });
}

export function useAddCustomer() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CustomerInput) => {
      if (!actor) throw new Error("No actor");
      return actor.addCustomer(input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}

export function useUpdateCustomer() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: bigint; input: CustomerInput }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateCustomer(id, input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}

export function useDeleteCustomer() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteCustomer(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}

export function useDeleteVehicle() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteVehicle(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vehicles"] }),
  });
}

export function useAddNote() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (content: string) => {
      if (!actor) throw new Error("No actor");
      return actor.addNote(content);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] }),
  });
}

export function useGetReport(filter: ReportFilter, enabled: boolean) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: [
      "report",
      JSON.stringify(filter, (_, v) =>
        typeof v === "bigint" ? v.toString() : v,
      ),
    ],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.getReport(filter);
    },
    enabled: !!actor && !isFetching && enabled,
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("No actor");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["currentUserProfile"] }),
  });
}

// ─── Husk Batch Entry Hooks ────────────────────────────────────────────────

export function useGetAllHuskBatchEntries() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["huskBatchEntries"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllHuskBatchEntries();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddHuskBatchEntry() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: HuskBatchEntryInput) => {
      if (!actor) throw new Error("No actor");
      return actor.addHuskBatchEntry(input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["huskBatchEntries"] });
      qc.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });
}

export function useUpdateHuskBatchEntry() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: { id: bigint; input: HuskBatchEntryInput }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateHuskBatchEntry(id, input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["huskBatchEntries"] }),
  });
}

export function useDeleteHuskBatchEntry() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteHuskBatchEntry(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["huskBatchEntries"] }),
  });
}

export function useGetHuskBatchReport(filter: ReportFilter, enabled: boolean) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: [
      "huskBatchReport",
      JSON.stringify(filter, (_, v) =>
        typeof v === "bigint" ? v.toString() : v,
      ),
    ],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.getHuskBatchReport(filter);
    },
    enabled: !!actor && !isFetching && enabled,
  });
}

// ─── Coconut Batch Entry Hooks ─────────────────────────────────────────────

export function useGetAllCoconutBatchEntries() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["coconutBatchEntries"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllCoconutBatchEntries();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddCoconutBatchEntry() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CoconutBatchEntryInput) => {
      if (!actor) throw new Error("No actor");
      return actor.addCoconutBatchEntry(input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["coconutBatchEntries"] });
      qc.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });
}

export function useUpdateCoconutBatchEntry() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: { id: bigint; input: CoconutBatchEntryInput }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateCoconutBatchEntry(id, input);
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["coconutBatchEntries"] }),
  });
}

export function useDeleteCoconutBatchEntry() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteCoconutBatchEntry(id);
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
  return useQuery({
    queryKey: [
      "coconutBatchReport",
      JSON.stringify(filter, (_, v) =>
        typeof v === "bigint" ? v.toString() : v,
      ),
    ],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.getCoconutBatchReport(filter);
    },
    enabled: !!actor && !isFetching && enabled,
  });
}
