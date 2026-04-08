import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Loader2, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  type CoconutBatchEntry,
  type CoconutItem,
  CoconutType,
  type HuskBatchEntry,
  type HuskItem,
  ItemType,
} from "../backend";
import { useAuthContext } from "../hooks/AuthContext";

import {
  useDeleteCoconutBatchEntry,
  useDeleteHuskBatchEntry,
  useGetAllCoconutBatchEntries,
  useGetAllHuskBatchEntries,
  useGetAllVehicles,
  useGetCoconutCustomers,
  useGetHuskCustomers,
  useUpdateCoconutBatchEntry,
  useUpdateCoconutBatchPayment,
  useUpdateHuskBatchEntry,
  useUpdateHuskBatchPayment,
} from "../hooks/useQueries";
import { useI18n } from "../i18n";
import { addAuditLog } from "../utils/auditLog";
import type { DuplicateEntryData } from "./NewEntry";

// Extended types with payment fields (added by backend payment feature)
type PaymentStatus = { paid: null } | { pending: null };
type HuskBatchEntryWithPayment = HuskBatchEntry & {
  paymentStatus?: PaymentStatus;
  paymentAmount?: [] | [bigint];
  lastModifiedAt?: [] | [bigint];
  lastModifiedByName?: [] | [string];
};
type CoconutBatchEntryWithPayment = CoconutBatchEntry & {
  paymentStatus?: PaymentStatus;
  paymentAmount?: [] | [bigint];
  lastModifiedAt?: [] | [bigint];
  lastModifiedByName?: [] | [string];
};

function nsToDate(ns: bigint): Date {
  return new Date(Number(ns / 1_000_000n));
}

function nsToDateTime(ns: bigint): string {
  const d = new Date(Number(ns / 1_000_000n));
  return `${d.toLocaleDateString("en-IN")} ${d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
}

const ITEM_COLORS: Record<string, string> = {
  [ItemType.husk]: "#154A27",
  [ItemType.dry]: "#2d7a4f",
  [ItemType.wet]: "#4e9e6e",
  [ItemType.both]: "#7dc4a0",
  [ItemType.motta]: "#a8c590",
  [ItemType.others]: "#8fb87e",
};

const COCONUT_COLORS: Record<string, string> = {
  [CoconutType.rasi]: "#8B5E3C",
  [CoconutType.tallu]: "#A0714F",
  [CoconutType.others]: "#7A4F30",
};

const ITEM_TYPES = [
  ItemType.husk,
  ItemType.dry,
  ItemType.wet,
  ItemType.both,
  ItemType.motta,
  ItemType.others,
];

const COCONUT_TYPES = [CoconutType.rasi, CoconutType.tallu, CoconutType.others];

const COCONUT_TYPE_LABELS: Record<CoconutType, string> = {
  [CoconutType.rasi]: "Rasi",
  [CoconutType.tallu]: "Tallu",
  [CoconutType.others]: "Others",
};

const ITEM_TYPE_LABELS: Record<ItemType, string> = {
  [ItemType.husk]: "Husk",
  [ItemType.dry]: "Dry",
  [ItemType.wet]: "Wet",
  [ItemType.both]: "Both",
  [ItemType.motta]: "Motta",
  [ItemType.others]: "Others",
};

type TabMode = "husk" | "coconut";
type DateFilter = "all" | "today" | "week" | "month";

interface EditHuskRow {
  id: number;
  itemType: ItemType;
  quantity: string;
}

interface EditCoconutRow {
  id: number;
  coconutType: CoconutType;
  specifyType: string;
  quantity: string;
}

let editRowCounter = 100;
function makeEditHuskRow(item?: HuskItem): EditHuskRow {
  return {
    id: editRowCounter++,
    itemType: item?.itemType ?? ItemType.husk,
    quantity: item ? item.quantity.toString() : "",
  };
}
function makeEditCoconutRow(item?: CoconutItem): EditCoconutRow {
  return {
    id: editRowCounter++,
    coconutType: item?.coconutType ?? CoconutType.rasi,
    specifyType: item?.specifyType ?? "",
    quantity: item ? item.quantity.toString() : "",
  };
}

function entryIsPaid(
  entry: HuskBatchEntryWithPayment | CoconutBatchEntryWithPayment,
): boolean {
  if (!entry.paymentStatus) return false;
  return "paid" in entry.paymentStatus;
}

function PaymentBadge({
  entry,
}: { entry: HuskBatchEntryWithPayment | CoconutBatchEntryWithPayment }) {
  const paid = entryIsPaid(entry);
  const amount = entry.paymentAmount?.[0];
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
        paid ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
      }`}
    >
      {paid ? "✅" : "⏳"}
      {paid ? " Paid" : " Pending"}
      {amount !== undefined && (
        <span className="ml-0.5 opacity-80">₹{amount.toString()}</span>
      )}
    </span>
  );
}

function getDateFilterRange(
  filter: DateFilter,
): { start: Date; end: Date } | null {
  if (filter === "all") return null;
  const now = new Date();
  const start = new Date();
  const end = new Date();
  if (filter === "today") {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (filter === "week") {
    const day = now.getDay();
    start.setDate(now.getDate() - day);
    start.setHours(0, 0, 0, 0);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  } else if (filter === "month") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(end.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
  }
  return { start, end };
}

export default function EntriesList({
  onDuplicate,
}: { onDuplicate?: (data: DuplicateEntryData) => void }) {
  const { t } = useI18n();
  const { data: huskBatchEntries, isLoading: huskLoading } =
    useGetAllHuskBatchEntries();
  const { data: coconutBatchEntries, isLoading: coconutLoading } =
    useGetAllCoconutBatchEntries();
  const { data: vehicles } = useGetAllVehicles();
  const { isAdmin, user } = useAuthContext();
  const updateHuskBatch = useUpdateHuskBatchEntry();
  const deleteHuskBatch = useDeleteHuskBatchEntry();
  const updateCoconutBatch = useUpdateCoconutBatchEntry();
  const deleteCoconutBatch = useDeleteCoconutBatchEntry();
  const updateHuskPayment = useUpdateHuskBatchPayment();
  const updateCoconutPayment = useUpdateCoconutBatchPayment();
  const { data: huskCustomers } = useGetHuskCustomers();
  const { data: coconutCustomers } = useGetCoconutCustomers();

  const [tab, setTab] = useState<TabMode>("husk");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");

  // Detail view state
  const [detailHusk, setDetailHusk] =
    useState<HuskBatchEntryWithPayment | null>(null);
  const [detailCoconut, setDetailCoconut] =
    useState<CoconutBatchEntryWithPayment | null>(null);

  // Husk batch edit state
  const [editHusk, setEditHusk] = useState<HuskBatchEntryWithPayment | null>(
    null,
  );
  const [editHuskCustomerId, setEditHuskCustomerId] = useState("");
  const [editHuskRows, setEditHuskRows] = useState<EditHuskRow[]>([]);
  const [editHuskVehicle, setEditHuskVehicle] = useState("");
  const [editHuskNotes, setEditHuskNotes] = useState("");
  const [editHuskPaymentStatus, setEditHuskPaymentStatus] = useState<
    "paid" | "pending"
  >("pending");
  const [editHuskPaymentAmount, setEditHuskPaymentAmount] = useState("");

  // Coconut batch edit state
  const [editCoconut, setEditCoconut] =
    useState<CoconutBatchEntryWithPayment | null>(null);
  const [editCoconutCustomerId, setEditCoconutCustomerId] = useState("");
  const [editCoconutRows, setEditCoconutRows] = useState<EditCoconutRow[]>([]);
  const [editCoconutVehicle, setEditCoconutVehicle] = useState("");
  const [editCoconutNotes, setEditCoconutNotes] = useState("");
  const [editCoconutPaymentStatus, setEditCoconutPaymentStatus] = useState<
    "paid" | "pending"
  >("pending");
  const [editCoconutPaymentAmount, setEditCoconutPaymentAmount] = useState("");

  const sortedVehicles = useMemo(
    () =>
      [...(vehicles ?? [])].sort((a, b) => Number(b.usageCount - a.usageCount)),
    [vehicles],
  );

  const dateRange = useMemo(() => getDateFilterRange(dateFilter), [dateFilter]);

  const filteredHusk = useMemo(() => {
    const q = search.toLowerCase();
    return [...((huskBatchEntries ?? []) as HuskBatchEntryWithPayment[])]
      .sort((a, b) => Number(b.createdAt - a.createdAt))
      .filter((e) => {
        const matchesSearch =
          e.customerName.toLowerCase().includes(q) ||
          e.vehicleNumber.toLowerCase().includes(q);
        if (!matchesSearch) return false;
        if (dateRange) {
          const entryDate = nsToDate(e.createdAt);
          return entryDate >= dateRange.start && entryDate <= dateRange.end;
        }
        return true;
      });
  }, [huskBatchEntries, search, dateRange]);

  const filteredCoconut = useMemo(() => {
    const q = search.toLowerCase();
    return [...((coconutBatchEntries ?? []) as CoconutBatchEntryWithPayment[])]
      .sort((a, b) => Number(b.createdAt - a.createdAt))
      .filter((e) => {
        const matchesSearch =
          e.customerName.toLowerCase().includes(q) ||
          e.vehicleNumber.toLowerCase().includes(q);
        if (!matchesSearch) return false;
        if (dateRange) {
          const entryDate = nsToDate(e.createdAt);
          return entryDate >= dateRange.start && entryDate <= dateRange.end;
        }
        return true;
      });
  }, [coconutBatchEntries, search, dateRange]);

  const openHuskEdit = (entry: HuskBatchEntryWithPayment) => {
    setEditHusk(entry);
    setEditHuskCustomerId(entry.customerId.toString());
    setEditHuskRows(entry.items.map((item) => makeEditHuskRow(item)));
    setEditHuskVehicle(entry.vehicleNumber);
    setEditHuskNotes(entry.notes);
    setEditHuskPaymentStatus(entryIsPaid(entry) ? "paid" : "pending");
    setEditHuskPaymentAmount(
      entry.paymentAmount?.[0] !== undefined
        ? entry.paymentAmount[0].toString()
        : "",
    );
  };

  const openCoconutEdit = (entry: CoconutBatchEntryWithPayment) => {
    setEditCoconut(entry);
    setEditCoconutCustomerId(entry.customerId.toString());
    setEditCoconutRows(entry.items.map((item) => makeEditCoconutRow(item)));
    setEditCoconutVehicle(entry.vehicleNumber);
    setEditCoconutNotes(entry.notes);
    setEditCoconutPaymentStatus(entryIsPaid(entry) ? "paid" : "pending");
    setEditCoconutPaymentAmount(
      entry.paymentAmount?.[0] !== undefined
        ? entry.paymentAmount[0].toString()
        : "",
    );
  };

  const updateEditHuskRow = (
    id: number,
    patch: Partial<Omit<EditHuskRow, "id">>,
  ) =>
    setEditHuskRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    );
  const removeEditHuskRow = (id: number) =>
    setEditHuskRows((prev) => prev.filter((r) => r.id !== id));

  const updateEditCoconutRow = (
    id: number,
    patch: Partial<Omit<EditCoconutRow, "id">>,
  ) =>
    setEditCoconutRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    );
  const removeEditCoconutRow = (id: number) =>
    setEditCoconutRows((prev) => prev.filter((r) => r.id !== id));

  const handleHuskUpdate = async () => {
    if (!editHusk) return;
    const cust = (huskCustomers ?? []).find(
      (c) => c.id.toString() === editHuskCustomerId,
    );
    try {
      await updateHuskBatch.mutateAsync({
        id: editHusk.id,
        input: {
          customerId: BigInt(editHuskCustomerId),
          customerName: cust?.name ?? editHusk.customerName,
          items: editHuskRows.map((r) => ({
            itemType: r.itemType,
            quantity: BigInt(r.quantity || "0"),
          })),
          vehicleNumber: editHuskVehicle,
          notes: editHuskNotes,
          createdByName: editHusk.createdByName,
        },
      });
      if (isAdmin) {
        await updateHuskPayment.mutateAsync({
          id: editHusk.id,
          status:
            editHuskPaymentStatus === "paid"
              ? { paid: null }
              : { pending: null },
          amount: editHuskPaymentAmount ? [BigInt(editHuskPaymentAmount)] : [],
        });
      }
      addAuditLog(
        user?.username ?? "unknown",
        "Entry Edited",
        `Husk entry ${editHusk.id.toString()}`,
      );
      toast.success("Entry updated!");
      setEditHusk(null);
    } catch {
      toast.error("Update failed");
    }
  };

  const handleCoconutUpdate = async () => {
    if (!editCoconut) return;
    const cust = (coconutCustomers ?? []).find(
      (c) => c.id.toString() === editCoconutCustomerId,
    );
    try {
      await updateCoconutBatch.mutateAsync({
        id: editCoconut.id,
        input: {
          customerId: BigInt(editCoconutCustomerId),
          customerName: cust?.name ?? editCoconut.customerName,
          items: editCoconutRows.map((r) => ({
            coconutType: r.coconutType,
            specifyType:
              r.coconutType === CoconutType.others ? r.specifyType : "",
            quantity: BigInt(r.quantity || "0"),
          })),
          vehicleNumber: editCoconutVehicle,
          notes: editCoconutNotes,
          createdByName: editCoconut.createdByName,
        },
      });
      if (isAdmin) {
        await updateCoconutPayment.mutateAsync({
          id: editCoconut.id,
          status:
            editCoconutPaymentStatus === "paid"
              ? { paid: null }
              : { pending: null },
          amount: editCoconutPaymentAmount
            ? [BigInt(editCoconutPaymentAmount)]
            : [],
        });
      }
      addAuditLog(
        user?.username ?? "unknown",
        "Entry Edited",
        `Coconut entry ${editCoconut.id.toString()}`,
      );
      toast.success("Coconut entry updated!");
      setEditCoconut(null);
    } catch {
      toast.error("Update failed");
    }
  };

  const handleHuskDelete = async (id: bigint) => {
    try {
      await deleteHuskBatch.mutateAsync(id);
      addAuditLog(
        user?.username ?? "unknown",
        "Entry Deleted",
        `Husk entry ${id.toString()}`,
      );
      toast.success("Entry deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  const handleCoconutDelete = async (id: bigint) => {
    try {
      await deleteCoconutBatch.mutateAsync(id);
      addAuditLog(
        user?.username ?? "unknown",
        "Entry Deleted",
        `Coconut entry ${id.toString()}`,
      );
      toast.success("Coconut entry deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  const isLoading = tab === "husk" ? huskLoading : coconutLoading;

  const DATE_FILTER_OPTIONS: { label: string; value: DateFilter }[] = [
    { label: t("all"), value: "all" },
    { label: t("today"), value: "today" },
    { label: t("thisWeek"), value: "week" },
    { label: t("thisMonth"), value: "month" },
  ];

  return (
    <div className="px-4 py-4 space-y-3">
      <h2 className="text-lg font-semibold" style={{ color: "#154A27" }}>
        {t("entries")}
      </h2>

      {/* Tab Toggle */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
        <button
          type="button"
          data-ocid="entries.husk_tab"
          onClick={() => {
            setTab("husk");
            setSearch("");
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === "husk"
              ? "bg-white shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
          style={tab === "husk" ? { color: "#154A27" } : {}}
        >
          <img
            src="/assets/chatgpt_image_apr_1_2026_10_59_53_am-019d4787-a100-755d-a253-139059ad4aeb.png"
            alt="husk"
            className="w-6 h-6 object-contain inline-block"
          />{" "}
          {t("husk")}
        </button>
        <button
          type="button"
          data-ocid="entries.coconut_tab"
          onClick={() => {
            setTab("coconut");
            setSearch("");
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === "coconut"
              ? "bg-white shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
          style={tab === "coconut" ? { color: "#8B5E3C" } : {}}
        >
          🥥 {t("coconut")}
        </button>
      </div>

      {/* Quick Date Filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
        {DATE_FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setDateFilter(opt.value)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              dateFilter === opt.value
                ? tab === "husk"
                  ? "bg-[#154A27] text-white border-[#154A27]"
                  : "bg-[#8B5E3C] text-white border-[#8B5E3C]"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
        <Input
          data-ocid="entries.search_input"
          placeholder={`${t("search")} ${t("customer")}, ${t("vehicleNumber")}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-input pl-9 pr-9"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Result count */}
      {(search || dateFilter !== "all") && (
        <p className="text-xs text-muted-foreground">
          {tab === "husk" ? filteredHusk.length : filteredCoconut.length}{" "}
          {t("results")}
        </p>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : tab === "husk" ? (
        filteredHusk.length === 0 ? (
          <Card className="shadow-card border-0">
            <CardContent
              className="p-6 text-center text-sm text-muted-foreground"
              data-ocid="entries.empty_state"
            >
              {t("noData")}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredHusk.map((entry, idx) => {
              const canEditHusk =
                isAdmin || entry.createdByName === user?.username;
              const totalQty = entry.items.reduce(
                (sum, item) => sum + Number(item.quantity),
                0,
              );
              const hasEditInfo =
                entry.lastModifiedAt?.[0] !== undefined &&
                entry.lastModifiedByName?.[0] !== undefined;
              return (
                <Card
                  key={entry.id.toString()}
                  className="shadow-card border-0 transition-shadow cursor-pointer hover:shadow-card-hover"
                  data-ocid={`entries.item.${idx + 1}`}
                  onClick={() => setDetailHusk(entry)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">
                          {entry.customerName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {entry.vehicleNumber} &middot;{" "}
                          {nsToDateTime(entry.createdAt)}
                        </p>
                        {entry.createdByName && (
                          <p className="text-[10px] text-muted-foreground">
                            👤 {entry.createdByName}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {entry.items.map((item, itemIdx) => (
                            <Badge
                              key={`${entry.id.toString()}-${item.itemType}-${itemIdx}`}
                              className="text-[10px] font-medium text-white"
                              style={{
                                backgroundColor:
                                  ITEM_COLORS[item.itemType] ?? "#154A27",
                              }}
                            >
                              {ITEM_TYPE_LABELS[item.itemType]} –{" "}
                              {item.quantity.toString()}
                            </Badge>
                          ))}
                          {isAdmin && <PaymentBadge entry={entry} />}
                        </div>
                        {entry.notes && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {entry.notes}
                          </p>
                        )}
                        {hasEditInfo && (
                          <p className="text-[10px] text-muted-foreground italic mt-0.5">
                            ✏️ Edited by {entry.lastModifiedByName![0]} on{" "}
                            {nsToDateTime(entry.lastModifiedAt![0]!)}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span
                          className="text-sm font-bold"
                          style={{ color: "#154A27" }}
                        >
                          {totalQty} Nos
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {entry.items.length} item
                          {entry.items.length > 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                    {(canEditHusk || isAdmin) && (
                      <div className="flex justify-end gap-2 mt-2 flex-wrap">
                        {onDuplicate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            data-ocid={`entries.duplicate_button.${idx + 1}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onDuplicate({
                                entryType: "husk",
                                customerId: entry.customerId.toString(),
                                customerName: entry.customerName,
                                vehicleNumber: entry.vehicleNumber,
                                notes: entry.notes,
                                huskItems: entry.items.map((item) => ({
                                  itemType: item.itemType,
                                  quantity: item.quantity.toString(),
                                })),
                              });
                            }}
                            className="h-7 px-2 text-xs"
                            style={{ color: "#154A27" }}
                          >
                            <Copy size={12} className="mr-1" /> {t("duplicate")}
                          </Button>
                        )}
                        {canEditHusk && (
                          <Button
                            variant="ghost"
                            size="sm"
                            data-ocid={`entries.edit_button.${idx + 1}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              openHuskEdit(entry);
                            }}
                            className="h-7 px-2 text-xs"
                          >
                            <Pencil size={12} className="mr-1" /> {t("edit")}
                          </Button>
                        )}
                        {isAdmin && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                data-ocid={`entries.delete_button.${idx + 1}`}
                                onClick={(e) => e.stopPropagation()}
                                className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                              >
                                <Trash2 size={12} className="mr-1" />{" "}
                                {t("delete")}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Entry?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel data-ocid="entries.cancel_button">
                                  {t("cancel")}
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  data-ocid="entries.confirm_button"
                                  onClick={() => handleHuskDelete(entry.id)}
                                  className="bg-destructive text-white"
                                >
                                  {t("delete")}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )
      ) : filteredCoconut.length === 0 ? (
        <Card className="shadow-card border-0">
          <CardContent
            className="p-6 text-center text-sm text-muted-foreground"
            data-ocid="entries.empty_state"
          >
            {t("noData")}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredCoconut.map((entry, idx) => {
            const canEditCoconut =
              isAdmin || entry.createdByName === user?.username;
            const totalQty = entry.items.reduce(
              (sum, item) => sum + Number(item.quantity),
              0,
            );
            const hasEditInfo =
              entry.lastModifiedAt?.[0] !== undefined &&
              entry.lastModifiedByName?.[0] !== undefined;
            return (
              <Card
                key={entry.id.toString()}
                className="shadow-card border-0 transition-shadow cursor-pointer hover:shadow-card-hover"
                data-ocid={`entries.item.${idx + 1}`}
                onClick={() => setDetailCoconut(entry)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">
                        {entry.customerName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {entry.vehicleNumber} &middot;{" "}
                        {nsToDateTime(entry.createdAt)}
                      </p>
                      {entry.createdByName && (
                        <p className="text-[10px] text-muted-foreground">
                          👤 {entry.createdByName}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {entry.items.map((item, itemIdx) => (
                          <Badge
                            key={`${entry.id.toString()}-${item.coconutType}-${itemIdx}`}
                            className="text-[10px] font-medium text-white"
                            style={{
                              backgroundColor:
                                COCONUT_COLORS[item.coconutType] ?? "#8B5E3C",
                            }}
                          >
                            {item.coconutType === CoconutType.others &&
                            item.specifyType
                              ? item.specifyType
                              : COCONUT_TYPE_LABELS[item.coconutType]}{" "}
                            – {item.quantity.toString()}
                          </Badge>
                        ))}
                        {isAdmin && <PaymentBadge entry={entry} />}
                      </div>
                      {entry.notes && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {entry.notes}
                        </p>
                      )}
                      {hasEditInfo && (
                        <p className="text-[10px] text-muted-foreground italic mt-0.5">
                          ✏️ Edited by {entry.lastModifiedByName![0]} on{" "}
                          {nsToDateTime(entry.lastModifiedAt![0]!)}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className="text-sm font-bold"
                        style={{ color: "#8B5E3C" }}
                      >
                        {totalQty} Nos
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {entry.items.length} item
                        {entry.items.length > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  {(canEditCoconut || isAdmin) && (
                    <div className="flex justify-end gap-2 mt-2 flex-wrap">
                      {onDuplicate && (
                        <Button
                          variant="ghost"
                          size="sm"
                          data-ocid={`entries.duplicate_button.${idx + 1}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onDuplicate({
                              entryType: "coconut",
                              customerId: entry.customerId.toString(),
                              customerName: entry.customerName,
                              vehicleNumber: entry.vehicleNumber,
                              notes: entry.notes,
                              coconutItems: entry.items.map((item) => ({
                                coconutType: item.coconutType,
                                specifyType: item.specifyType,
                                quantity: item.quantity.toString(),
                              })),
                            });
                          }}
                          className="h-7 px-2 text-xs"
                          style={{ color: "#8B5E3C" }}
                        >
                          <Copy size={12} className="mr-1" /> {t("duplicate")}
                        </Button>
                      )}
                      {canEditCoconut && (
                        <Button
                          variant="ghost"
                          size="sm"
                          data-ocid={`entries.edit_button.${idx + 1}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            openCoconutEdit(entry);
                          }}
                          className="h-7 px-2 text-xs"
                        >
                          <Pencil size={12} className="mr-1" /> {t("edit")}
                        </Button>
                      )}
                      {isAdmin && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              data-ocid={`entries.delete_button.${idx + 1}`}
                              onClick={(e) => e.stopPropagation()}
                              className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                            >
                              <Trash2 size={12} className="mr-1" />{" "}
                              {t("delete")}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Coconut Entry?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel data-ocid="entries.cancel_button">
                                {t("cancel")}
                              </AlertDialogCancel>
                              <AlertDialogAction
                                data-ocid="entries.confirm_button"
                                onClick={() => handleCoconutDelete(entry.id)}
                                className="bg-destructive text-white"
                              >
                                {t("delete")}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Husk Detail Sheet */}
      <Sheet
        open={!!detailHusk}
        onOpenChange={(o) => !o && setDetailHusk(null)}
      >
        <SheetContent
          side="bottom"
          className="max-w-[430px] mx-auto rounded-t-2xl max-h-[90vh] overflow-y-auto"
          data-ocid="entries.sheet"
        >
          <SheetHeader>
            <SheetTitle style={{ color: "#154A27" }}>
              🌿 {t("huskEntry")}
            </SheetTitle>
          </SheetHeader>
          {detailHusk && (
            <div className="space-y-4 mt-4 pb-6">
              {/* Customer name */}
              <div>
                <p className="text-xl font-bold text-gray-900">
                  {detailHusk.customerName}
                </p>
              </div>

              {/* Vehicle & Date */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-medium">🚚 {t("vehicleNumber")}:</span>
                  <span>{detailHusk.vehicleNumber}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-medium">📅 {t("date")}:</span>
                  <span>{nsToDateTime(detailHusk.createdAt)}</span>
                </div>
                {detailHusk.createdByName && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>👤 {detailHusk.createdByName}</span>
                  </div>
                )}
              </div>

              {/* Items */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {t("itemType")} &amp; {t("quantity")}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {detailHusk.items.map((item, itemIdx) => (
                    <Badge
                      key={`detail-husk-${item.itemType}-${itemIdx}`}
                      className="text-xs font-medium text-white px-2.5 py-1"
                      style={{
                        backgroundColor:
                          ITEM_COLORS[item.itemType] ?? "#154A27",
                      }}
                    >
                      {ITEM_TYPE_LABELS[item.itemType]} –{" "}
                      {item.quantity.toString()}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm font-bold" style={{ color: "#154A27" }}>
                  {t("totalQuantity")}:{" "}
                  {detailHusk.items.reduce(
                    (sum, item) => sum + Number(item.quantity),
                    0,
                  )}{" "}
                  Nos
                </p>
              </div>

              {/* Notes */}
              {detailHusk.notes && (
                <div className="bg-gray-50 rounded-lg px-3 py-2">
                  <p className="text-xs font-semibold text-gray-500 mb-1">
                    {t("notes_label")}
                  </p>
                  <p className="text-sm text-gray-700">{detailHusk.notes}</p>
                </div>
              )}

              {/* Edit history */}
              {detailHusk.lastModifiedAt?.[0] !== undefined &&
                detailHusk.lastModifiedByName?.[0] !== undefined && (
                  <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700">
                    ✏️ Edited by {detailHusk.lastModifiedByName[0]} on{" "}
                    {nsToDateTime(detailHusk.lastModifiedAt[0])}
                  </div>
                )}

              {/* Payment (admin only) */}
              {isAdmin && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600">
                    💳 Payment:
                  </span>
                  <PaymentBadge entry={detailHusk} />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                {(isAdmin || detailHusk.createdByName === user?.username) && (
                  <Button
                    data-ocid="entries.edit_button"
                    className="flex-1 text-white"
                    style={{ backgroundColor: "#154A27" }}
                    onClick={() => {
                      setDetailHusk(null);
                      openHuskEdit(detailHusk);
                    }}
                  >
                    <Pencil size={14} className="mr-1.5" /> {t("edit")}
                  </Button>
                )}
                <Button
                  data-ocid="entries.close_button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setDetailHusk(null)}
                >
                  {t("close")}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Coconut Detail Sheet */}
      <Sheet
        open={!!detailCoconut}
        onOpenChange={(o) => !o && setDetailCoconut(null)}
      >
        <SheetContent
          side="bottom"
          className="max-w-[430px] mx-auto rounded-t-2xl max-h-[90vh] overflow-y-auto"
          data-ocid="entries.sheet"
        >
          <SheetHeader>
            <SheetTitle style={{ color: "#8B5E3C" }}>
              🥥 {t("coconutEntry")}
            </SheetTitle>
          </SheetHeader>
          {detailCoconut && (
            <div className="space-y-4 mt-4 pb-6">
              {/* Customer name */}
              <div>
                <p className="text-xl font-bold text-gray-900">
                  {detailCoconut.customerName}
                </p>
              </div>

              {/* Vehicle & Date */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-medium">🚚 {t("vehicleNumber")}:</span>
                  <span>{detailCoconut.vehicleNumber}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-medium">📅 {t("date")}:</span>
                  <span>{nsToDateTime(detailCoconut.createdAt)}</span>
                </div>
                {detailCoconut.createdByName && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>👤 {detailCoconut.createdByName}</span>
                  </div>
                )}
              </div>

              {/* Items */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {t("coconutType")} &amp; {t("quantity")}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {detailCoconut.items.map((item, itemIdx) => (
                    <Badge
                      key={`detail-coconut-${item.coconutType}-${itemIdx}`}
                      className="text-xs font-medium text-white px-2.5 py-1"
                      style={{
                        backgroundColor:
                          COCONUT_COLORS[item.coconutType] ?? "#8B5E3C",
                      }}
                    >
                      {item.coconutType === CoconutType.others &&
                      item.specifyType
                        ? item.specifyType
                        : COCONUT_TYPE_LABELS[item.coconutType]}{" "}
                      – {item.quantity.toString()}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm font-bold" style={{ color: "#8B5E3C" }}>
                  {t("totalQuantity")}:{" "}
                  {detailCoconut.items.reduce(
                    (sum, item) => sum + Number(item.quantity),
                    0,
                  )}{" "}
                  Nos
                </p>
              </div>

              {/* Notes */}
              {detailCoconut.notes && (
                <div className="bg-gray-50 rounded-lg px-3 py-2">
                  <p className="text-xs font-semibold text-gray-500 mb-1">
                    {t("notes_label")}
                  </p>
                  <p className="text-sm text-gray-700">{detailCoconut.notes}</p>
                </div>
              )}

              {/* Edit history */}
              {detailCoconut.lastModifiedAt?.[0] !== undefined &&
                detailCoconut.lastModifiedByName?.[0] !== undefined && (
                  <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700">
                    ✏️ Edited by {detailCoconut.lastModifiedByName[0]} on{" "}
                    {nsToDateTime(detailCoconut.lastModifiedAt[0])}
                  </div>
                )}

              {/* Payment (admin only) */}
              {isAdmin && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600">
                    💳 Payment:
                  </span>
                  <PaymentBadge entry={detailCoconut} />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                {(isAdmin ||
                  detailCoconut.createdByName === user?.username) && (
                  <Button
                    data-ocid="entries.edit_button"
                    className="flex-1 text-white"
                    style={{ backgroundColor: "#8B5E3C" }}
                    onClick={() => {
                      setDetailCoconut(null);
                      openCoconutEdit(detailCoconut);
                    }}
                  >
                    <Pencil size={14} className="mr-1.5" /> {t("edit")}
                  </Button>
                )}
                <Button
                  data-ocid="entries.close_button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setDetailCoconut(null)}
                >
                  {t("close")}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Husk Batch Edit Sheet */}
      <Sheet open={!!editHusk} onOpenChange={(o) => !o && setEditHusk(null)}>
        <SheetContent
          side="bottom"
          className="max-w-[430px] mx-auto rounded-t-2xl max-h-[90vh] overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle style={{ color: "#154A27" }}>
              {t("edit")} {t("entries")}
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-4 pb-6" data-ocid="entries.dialog">
            {/* Edit history info */}
            {editHusk?.lastModifiedAt?.[0] !== undefined &&
              editHusk?.lastModifiedByName?.[0] !== undefined && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700">
                  📝 Last edited by {editHusk.lastModifiedByName[0]} on{" "}
                  {nsToDateTime(editHusk.lastModifiedAt[0])}
                </div>
              )}

            <div className="space-y-1">
              <Label className="text-xs font-semibold">{t("customer")}</Label>
              <Select
                value={editHuskCustomerId}
                onValueChange={setEditHuskCustomerId}
              >
                <SelectTrigger
                  data-ocid="entries.select"
                  className="border-input"
                >
                  <SelectValue placeholder={t("customer")} />
                </SelectTrigger>
                <SelectContent>
                  {(huskCustomers ?? []).map((c) => (
                    <SelectItem key={c.id.toString()} value={c.id.toString()}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">
                {t("itemType")} &amp; {t("quantity")}
              </Label>
              {editHuskRows.map((row, index) => (
                <div
                  key={row.id}
                  className="flex gap-2 items-start bg-green-50 border border-green-100 rounded-lg p-2"
                >
                  <div className="flex-1 space-y-2">
                    <Select
                      value={row.itemType}
                      onValueChange={(v) =>
                        updateEditHuskRow(row.id, { itemType: v as ItemType })
                      }
                    >
                      <SelectTrigger className="border-input bg-white h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ITEM_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {ITEM_TYPE_LABELS[type]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      data-ocid={`entries.input.${index + 1}`}
                      type="number"
                      min="1"
                      value={row.quantity}
                      onChange={(e) =>
                        updateEditHuskRow(row.id, { quantity: e.target.value })
                      }
                      className="border-input bg-white h-9 text-sm"
                      placeholder="Qty (Nos)"
                    />
                  </div>
                  {editHuskRows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEditHuskRow(row.id)}
                      className="mt-1 p-1 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setEditHuskRows((prev) => [...prev, makeEditHuskRow()])
                }
                className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border border-dashed transition-colors"
                style={{ color: "#154A27", borderColor: "#154A27" }}
              >
                <Plus className="h-4 w-4" />
                {t("addItem")}
              </button>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">
                {t("vehicleNumber")}
              </Label>
              <Select
                value={editHuskVehicle}
                onValueChange={setEditHuskVehicle}
              >
                <SelectTrigger className="border-input">
                  <SelectValue placeholder={t("vehicleNumber")} />
                </SelectTrigger>
                <SelectContent>
                  {sortedVehicles.map((v) => (
                    <SelectItem key={v.id.toString()} value={v.vehicleNumber}>
                      {v.vehicleNumber} ({v.usageCount.toString()}x)
                    </SelectItem>
                  ))}
                  {editHuskVehicle &&
                    !sortedVehicles.find(
                      (v) => v.vehicleNumber === editHuskVehicle,
                    ) && (
                      <SelectItem value={editHuskVehicle}>
                        {editHuskVehicle}
                      </SelectItem>
                    )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">
                {t("notes_label")}
              </Label>
              <Textarea
                data-ocid="entries.textarea"
                value={editHuskNotes}
                onChange={(e) => setEditHuskNotes(e.target.value)}
                rows={2}
                className="border-input resize-none"
              />
            </div>

            {/* Admin-only Payment Section */}
            {isAdmin && (
              <div className="space-y-2 pt-2 border-t border-dashed border-gray-200">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  💳 Payment (Admin Only)
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    data-ocid="entries.toggle"
                    onClick={() => setEditHuskPaymentStatus("paid")}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                      editHuskPaymentStatus === "paid"
                        ? "bg-green-600 text-white border-green-600"
                        : "bg-white text-gray-600 border-gray-200 hover:border-green-400"
                    }`}
                  >
                    ✅ Paid
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditHuskPaymentStatus("pending")}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                      editHuskPaymentStatus === "pending"
                        ? "bg-amber-500 text-white border-amber-500"
                        : "bg-white text-gray-600 border-gray-200 hover:border-amber-400"
                    }`}
                  >
                    ⏳ Pending
                  </button>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">
                    Amount (optional)
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                      ₹
                    </span>
                    <Input
                      data-ocid="entries.input"
                      type="number"
                      min="0"
                      value={editHuskPaymentAmount}
                      onChange={(e) => setEditHuskPaymentAmount(e.target.value)}
                      className="border-input pl-7"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            )}

            <Button
              data-ocid="entries.save_button"
              className="w-full text-white"
              style={{ backgroundColor: "#154A27" }}
              onClick={handleHuskUpdate}
              disabled={
                updateHuskBatch.isPending || updateHuskPayment.isPending
              }
            >
              {updateHuskBatch.isPending || updateHuskPayment.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("loading")}
                </>
              ) : (
                t("save")
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Coconut Batch Edit Sheet */}
      <Sheet
        open={!!editCoconut}
        onOpenChange={(o) => !o && setEditCoconut(null)}
      >
        <SheetContent
          side="bottom"
          className="max-w-[430px] mx-auto rounded-t-2xl max-h-[90vh] overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle style={{ color: "#8B5E3C" }}>
              {t("edit")} {t("coconutEntry")}
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-4 pb-6" data-ocid="entries.dialog">
            {/* Edit history info */}
            {editCoconut?.lastModifiedAt?.[0] !== undefined &&
              editCoconut?.lastModifiedByName?.[0] !== undefined && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700">
                  📝 Last edited by {editCoconut.lastModifiedByName[0]} on{" "}
                  {nsToDateTime(editCoconut.lastModifiedAt[0])}
                </div>
              )}

            <div className="space-y-1">
              <Label className="text-xs font-semibold">{t("customer")}</Label>
              <Select
                value={editCoconutCustomerId}
                onValueChange={setEditCoconutCustomerId}
              >
                <SelectTrigger className="border-input">
                  <SelectValue placeholder={t("customer")} />
                </SelectTrigger>
                <SelectContent>
                  {(coconutCustomers ?? []).map((c) => (
                    <SelectItem key={c.id.toString()} value={c.id.toString()}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">
                {t("coconutType")} &amp; {t("quantity")}
              </Label>
              {editCoconutRows.map((row, index) => (
                <div
                  key={row.id}
                  className="flex gap-2 items-start bg-amber-50 border border-amber-100 rounded-lg p-2"
                >
                  <div className="flex-1 space-y-2">
                    <Select
                      value={row.coconutType}
                      onValueChange={(v) =>
                        updateEditCoconutRow(row.id, {
                          coconutType: v as CoconutType,
                        })
                      }
                    >
                      <SelectTrigger className="border-input bg-white h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COCONUT_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {COCONUT_TYPE_LABELS[type]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {row.coconutType === CoconutType.others && (
                      <Input
                        placeholder="Specify type"
                        value={row.specifyType}
                        onChange={(e) =>
                          updateEditCoconutRow(row.id, {
                            specifyType: e.target.value,
                          })
                        }
                        className="border-input bg-white h-9 text-sm"
                      />
                    )}
                    <Input
                      data-ocid={`entries.input.${index + 1}`}
                      type="number"
                      min="1"
                      value={row.quantity}
                      onChange={(e) =>
                        updateEditCoconutRow(row.id, {
                          quantity: e.target.value,
                        })
                      }
                      className="border-input bg-white h-9 text-sm"
                      placeholder="Qty (Nos)"
                    />
                  </div>
                  {editCoconutRows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEditCoconutRow(row.id)}
                      className="mt-1 p-1 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setEditCoconutRows((prev) => [...prev, makeEditCoconutRow()])
                }
                className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border border-dashed transition-colors"
                style={{ color: "#8B5E3C", borderColor: "#8B5E3C" }}
              >
                <Plus className="h-4 w-4" />
                {t("addItem")}
              </button>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">
                {t("vehicleNumber")}
              </Label>
              <Select
                value={editCoconutVehicle}
                onValueChange={setEditCoconutVehicle}
              >
                <SelectTrigger className="border-input">
                  <SelectValue placeholder={t("vehicleNumber")} />
                </SelectTrigger>
                <SelectContent>
                  {sortedVehicles.map((v) => (
                    <SelectItem key={v.id.toString()} value={v.vehicleNumber}>
                      {v.vehicleNumber} ({v.usageCount.toString()}x)
                    </SelectItem>
                  ))}
                  {editCoconutVehicle &&
                    !sortedVehicles.find(
                      (v) => v.vehicleNumber === editCoconutVehicle,
                    ) && (
                      <SelectItem value={editCoconutVehicle}>
                        {editCoconutVehicle}
                      </SelectItem>
                    )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">
                {t("notes_label")}
              </Label>
              <Textarea
                value={editCoconutNotes}
                onChange={(e) => setEditCoconutNotes(e.target.value)}
                rows={2}
                className="border-input resize-none"
              />
            </div>

            {/* Admin-only Payment Section */}
            {isAdmin && (
              <div className="space-y-2 pt-2 border-t border-dashed border-gray-200">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  💳 Payment (Admin Only)
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    data-ocid="entries.toggle"
                    onClick={() => setEditCoconutPaymentStatus("paid")}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                      editCoconutPaymentStatus === "paid"
                        ? "bg-green-600 text-white border-green-600"
                        : "bg-white text-gray-600 border-gray-200 hover:border-green-400"
                    }`}
                  >
                    ✅ Paid
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditCoconutPaymentStatus("pending")}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                      editCoconutPaymentStatus === "pending"
                        ? "bg-amber-500 text-white border-amber-500"
                        : "bg-white text-gray-600 border-gray-200 hover:border-amber-400"
                    }`}
                  >
                    ⏳ Pending
                  </button>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">
                    Amount (optional)
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                      ₹
                    </span>
                    <Input
                      type="number"
                      min="0"
                      value={editCoconutPaymentAmount}
                      onChange={(e) =>
                        setEditCoconutPaymentAmount(e.target.value)
                      }
                      className="border-input pl-7"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            )}

            <Button
              data-ocid="entries.save_button"
              className="w-full text-white"
              style={{ backgroundColor: "#8B5E3C" }}
              onClick={handleCoconutUpdate}
              disabled={
                updateCoconutBatch.isPending || updateCoconutPayment.isPending
              }
            >
              {updateCoconutBatch.isPending ||
              updateCoconutPayment.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("loading")}
                </>
              ) : (
                t("save")
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
