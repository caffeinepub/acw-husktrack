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
import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
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
import {
  useDeleteCoconutBatchEntry,
  useDeleteHuskBatchEntry,
  useGetAllCoconutBatchEntries,
  useGetAllCustomers,
  useGetAllHuskBatchEntries,
  useGetAllVehicles,
  useIsAdmin,
  useUpdateCoconutBatchEntry,
  useUpdateHuskBatchEntry,
} from "../hooks/useQueries";
import { useI18n } from "../i18n";

function nsToDate(ns: bigint): Date {
  return new Date(Number(ns / 1_000_000n));
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

export default function EntriesList() {
  const { t } = useI18n();
  const { data: huskBatchEntries, isLoading: huskLoading } =
    useGetAllHuskBatchEntries();
  const { data: coconutBatchEntries, isLoading: coconutLoading } =
    useGetAllCoconutBatchEntries();
  const { data: customers } = useGetAllCustomers();
  const { data: vehicles } = useGetAllVehicles();
  const { data: isAdmin } = useIsAdmin();
  const updateHuskBatch = useUpdateHuskBatchEntry();
  const deleteHuskBatch = useDeleteHuskBatchEntry();
  const updateCoconutBatch = useUpdateCoconutBatchEntry();
  const deleteCoconutBatch = useDeleteCoconutBatchEntry();

  const [tab, setTab] = useState<TabMode>("husk");
  const [search, setSearch] = useState("");

  // Husk batch edit state
  const [editHusk, setEditHusk] = useState<HuskBatchEntry | null>(null);
  const [editHuskCustomerId, setEditHuskCustomerId] = useState("");
  const [editHuskRows, setEditHuskRows] = useState<EditHuskRow[]>([]);
  const [editHuskVehicle, setEditHuskVehicle] = useState("");
  const [editHuskNotes, setEditHuskNotes] = useState("");

  // Coconut batch edit state
  const [editCoconut, setEditCoconut] = useState<CoconutBatchEntry | null>(
    null,
  );
  const [editCoconutCustomerId, setEditCoconutCustomerId] = useState("");
  const [editCoconutRows, setEditCoconutRows] = useState<EditCoconutRow[]>([]);
  const [editCoconutVehicle, setEditCoconutVehicle] = useState("");
  const [editCoconutNotes, setEditCoconutNotes] = useState("");

  const sortedVehicles = useMemo(
    () =>
      [...(vehicles ?? [])].sort((a, b) => Number(b.usageCount - a.usageCount)),
    [vehicles],
  );

  const filteredHusk = useMemo(() => {
    const q = search.toLowerCase();
    return [...(huskBatchEntries ?? [])]
      .sort((a, b) => Number(b.createdAt - a.createdAt))
      .filter(
        (e) =>
          e.customerName.toLowerCase().includes(q) ||
          e.vehicleNumber.toLowerCase().includes(q),
      );
  }, [huskBatchEntries, search]);

  const filteredCoconut = useMemo(() => {
    const q = search.toLowerCase();
    return [...(coconutBatchEntries ?? [])]
      .sort((a, b) => Number(b.createdAt - a.createdAt))
      .filter(
        (e) =>
          e.customerName.toLowerCase().includes(q) ||
          e.vehicleNumber.toLowerCase().includes(q),
      );
  }, [coconutBatchEntries, search]);

  const openHuskEdit = (entry: HuskBatchEntry) => {
    setEditHusk(entry);
    setEditHuskCustomerId(entry.customerId.toString());
    setEditHuskRows(entry.items.map((item) => makeEditHuskRow(item)));
    setEditHuskVehicle(entry.vehicleNumber);
    setEditHuskNotes(entry.notes);
  };

  const openCoconutEdit = (entry: CoconutBatchEntry) => {
    setEditCoconut(entry);
    setEditCoconutCustomerId(entry.customerId.toString());
    setEditCoconutRows(entry.items.map((item) => makeEditCoconutRow(item)));
    setEditCoconutVehicle(entry.vehicleNumber);
    setEditCoconutNotes(entry.notes);
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
    const cust = (customers ?? []).find(
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
      toast.success("Entry updated!");
      setEditHusk(null);
    } catch {
      toast.error("Update failed");
    }
  };

  const handleCoconutUpdate = async () => {
    if (!editCoconut) return;
    const cust = (customers ?? []).find(
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
      toast.success("Coconut entry updated!");
      setEditCoconut(null);
    } catch {
      toast.error("Update failed");
    }
  };

  const handleHuskDelete = async (id: bigint) => {
    try {
      await deleteHuskBatch.mutateAsync(id);
      toast.success("Entry deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  const handleCoconutDelete = async (id: bigint) => {
    try {
      await deleteCoconutBatch.mutateAsync(id);
      toast.success("Coconut entry deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  const isLoading = tab === "husk" ? huskLoading : coconutLoading;

  return (
    <div className="px-4 py-4 space-y-4">
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
          🌿 {t("husk")}
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

      <Input
        data-ocid="entries.search_input"
        placeholder={`${t("search")}...`}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border-input"
      />

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
              const totalQty = entry.items.reduce(
                (sum, item) => sum + Number(item.quantity),
                0,
              );
              return (
                <Card
                  key={entry.id.toString()}
                  className="shadow-card border-0 cursor-pointer hover:shadow-card-hover transition-shadow"
                  data-ocid={`entries.item.${idx + 1}`}
                  onClick={() => openHuskEdit(entry)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">
                          {entry.customerName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {entry.vehicleNumber} &middot;{" "}
                          {nsToDate(entry.createdAt).toLocaleDateString(
                            "en-IN",
                          )}
                        </p>
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
                        </div>
                        {entry.notes && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {entry.notes}
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
                    {isAdmin && (
                      <div className="flex justify-end gap-2 mt-2">
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
                              <AlertDialogTitle>Delete Entry?</AlertDialogTitle>
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
            const totalQty = entry.items.reduce(
              (sum, item) => sum + Number(item.quantity),
              0,
            );
            return (
              <Card
                key={entry.id.toString()}
                className="shadow-card border-0 cursor-pointer hover:shadow-card-hover transition-shadow"
                data-ocid={`entries.item.${idx + 1}`}
                onClick={() => openCoconutEdit(entry)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">
                        {entry.customerName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {entry.vehicleNumber} &middot;{" "}
                        {nsToDate(entry.createdAt).toLocaleDateString("en-IN")}
                      </p>
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
                      </div>
                      {entry.notes && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {entry.notes}
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
                  <div className="flex justify-end gap-2 mt-2">
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
                            <Trash2 size={12} className="mr-1" /> {t("delete")}
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
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

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
                  {(customers ?? []).map((c) => (
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
            <Button
              data-ocid="entries.save_button"
              className="w-full text-white"
              style={{ backgroundColor: "#154A27" }}
              onClick={handleHuskUpdate}
              disabled={updateHuskBatch.isPending}
            >
              {updateHuskBatch.isPending ? (
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
                  {(customers ?? []).map((c) => (
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
            <Button
              data-ocid="entries.save_button"
              className="w-full text-white"
              style={{ backgroundColor: "#8B5E3C" }}
              onClick={handleCoconutUpdate}
              disabled={updateCoconutBatch.isPending}
            >
              {updateCoconutBatch.isPending ? (
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
