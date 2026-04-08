import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CalendarDays, Copy, Loader2, Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CoconutType, ItemType } from "../backend";
import { useAuthContext } from "../hooks/AuthContext";
import {
  addLocalCustomer,
  getCoconutCustomers,
  getHuskCustomers,
} from "../hooks/useLocalCustomers";
import {
  useAddCoconutBatchEntry,
  useAddHuskBatchEntry,
  useGetAllVehicles,
} from "../hooks/useQueries";
import { type TranslationKeys, useI18n } from "../i18n";
import { addAuditLog } from "../utils/auditLog";

const ITEM_TYPES = [
  ItemType.husk,
  ItemType.dry,
  ItemType.wet,
  ItemType.both,
  ItemType.motta,
  ItemType.others,
];

const ITEM_TYPE_LABELS: Record<ItemType, string> = {
  [ItemType.husk]: "Husk",
  [ItemType.dry]: "Dry",
  [ItemType.wet]: "Wet",
  [ItemType.both]: "Both",
  [ItemType.motta]: "Motta",
  [ItemType.others]: "Others",
};

const COCONUT_TYPES = [CoconutType.rasi, CoconutType.tallu, CoconutType.others];

const COCONUT_TYPE_LABELS: Record<CoconutType, string> = {
  [CoconutType.rasi]: "Rasi",
  [CoconutType.tallu]: "Tallu",
  [CoconutType.others]: "Others",
};

interface ItemRow {
  id: number;
  itemType: ItemType;
  quantity: string;
}

interface CoconutRow {
  id: number;
  coconutType: CoconutType;
  specifyType: string;
  quantity: string;
}

let rowIdCounter = 1;
function makeRow(itemType?: ItemType, quantity?: string): ItemRow {
  return {
    id: rowIdCounter++,
    itemType: itemType ?? ItemType.husk,
    quantity: quantity ?? "",
  };
}
function makeCoconutRow(
  coconutType?: CoconutType,
  specifyType?: string,
  quantity?: string,
): CoconutRow {
  return {
    id: rowIdCounter++,
    coconutType: coconutType ?? CoconutType.rasi,
    specifyType: specifyType ?? "",
    quantity: quantity ?? "",
  };
}

type EntryMode = "husk" | "coconut";

// ─── Duplicate Entry Data shape (exported for App.tsx) ───────────────────────
export interface DuplicateEntryData {
  entryType: "husk" | "coconut";
  customerId: string;
  customerName: string;
  vehicleNumber: string;
  notes: string;
  huskItems?: Array<{ itemType: ItemType; quantity: string }>;
  coconutItems?: Array<{
    coconutType: CoconutType;
    specifyType: string;
    quantity: string;
  }>;
}

export default function NewEntry({
  userName,
  initialMode = "husk",
  duplicateData = null,
}: {
  userName: string;
  initialMode?: "husk" | "coconut";
  duplicateData?: DuplicateEntryData | null;
}) {
  const { t } = useI18n();
  const { isAdmin } = useAuthContext();
  const { data: vehicles } = useGetAllVehicles();
  const addHuskBatchEntry = useAddHuskBatchEntry();
  const addCoconutBatchEntry = useAddCoconutBatchEntry();

  // Admin past-date entry
  const todayStr = new Date().toISOString().split("T")[0];
  const [entryDate, setEntryDate] = useState<string>(todayStr);

  // Add customer quick-add dialog
  const [addCustOpen, setAddCustOpen] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustLocation, setNewCustLocation] = useState("");

  const handleAddCustomer = () => {
    if (!newCustName.trim()) {
      toast.error("Name is required");
      return;
    }
    const created = addLocalCustomer(
      newCustName.trim(),
      newCustPhone.trim(),
      newCustLocation.trim(),
      entryMode,
    );
    setCustomerId(created.id.toString());
    setCustomerSearch(created.name);
    setAddCustOpen(false);
    setNewCustName("");
    setNewCustPhone("");
    setNewCustLocation("");
    setActiveCustomers(
      entryMode === "husk" ? getHuskCustomers() : getCoconutCustomers(),
    );
    toast.success("Customer added!");
  };

  // Determine initial mode from duplicateData or prop
  const resolvedInitialMode = duplicateData?.entryType ?? initialMode;
  const [entryMode, setEntryMode] = useState<EntryMode>(resolvedInitialMode);

  // Shared fields — pre-filled if duplicating
  const [customerId, setCustomerId] = useState(() =>
    duplicateData ? duplicateData.customerId : "",
  );
  const [customerSearch, setCustomerSearch] = useState(() =>
    duplicateData ? duplicateData.customerName : "",
  );
  const [customerDropOpen, setCustomerDropOpen] = useState(false);
  const [vehicleInput, setVehicleInput] = useState(() =>
    duplicateData ? duplicateData.vehicleNumber : "",
  );
  const [vehicleSearch, setVehicleSearch] = useState(() =>
    duplicateData ? duplicateData.vehicleNumber : "",
  );
  const [vehicleDropOpen, setVehicleDropOpen] = useState(false);
  const [notes, setNotes] = useState(() =>
    duplicateData ? duplicateData.notes : "",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Husk-specific — pre-filled if duplicating
  const [itemRows, setItemRows] = useState<ItemRow[]>(() => {
    if (duplicateData?.huskItems && duplicateData.huskItems.length > 0) {
      return duplicateData.huskItems.map((item) =>
        makeRow(item.itemType, item.quantity),
      );
    }
    return [makeRow()];
  });

  // Coconut-specific — pre-filled if duplicating
  const [coconutRows, setCoconutRows] = useState<CoconutRow[]>(() => {
    if (duplicateData?.coconutItems && duplicateData.coconutItems.length > 0) {
      return duplicateData.coconutItems.map((item) =>
        makeCoconutRow(item.coconutType, item.specifyType, item.quantity),
      );
    }
    return [makeCoconutRow()];
  });

  // Show banner if duplicating
  const [showDuplicateBanner, setShowDuplicateBanner] = useState(
    !!duplicateData,
  );

  // Load customers from local store
  const [activeCustomers, setActiveCustomers] = useState(() =>
    resolvedInitialMode === "husk" ? getHuskCustomers() : getCoconutCustomers(),
  );

  // When duplicateData changes (re-navigation), re-initialize
  useEffect(() => {
    if (duplicateData) {
      setEntryMode(duplicateData.entryType);
      setCustomerId(duplicateData.customerId);
      setCustomerSearch(duplicateData.customerName);
      setVehicleInput(duplicateData.vehicleNumber);
      setVehicleSearch(duplicateData.vehicleNumber);
      setNotes(duplicateData.notes);
      if (duplicateData.huskItems && duplicateData.huskItems.length > 0) {
        setItemRows(
          duplicateData.huskItems.map((item) =>
            makeRow(item.itemType, item.quantity),
          ),
        );
      }
      if (duplicateData.coconutItems && duplicateData.coconutItems.length > 0) {
        setCoconutRows(
          duplicateData.coconutItems.map((item) =>
            makeCoconutRow(item.coconutType, item.specifyType, item.quantity),
          ),
        );
      }
      setActiveCustomers(
        duplicateData.entryType === "husk"
          ? getHuskCustomers()
          : getCoconutCustomers(),
      );
      setShowDuplicateBanner(true);
      setEntryDate(new Date().toISOString().split("T")[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duplicateData]);

  const sortedVehicles = useMemo(
    () =>
      [...(vehicles ?? [])].sort((a, b) => Number(b.usageCount - a.usageCount)),
    [vehicles],
  );

  const filteredVehicles = useMemo(
    () =>
      sortedVehicles.filter((v) =>
        v.vehicleNumber.toLowerCase().includes(vehicleSearch.toLowerCase()),
      ),
    [sortedVehicles, vehicleSearch],
  );

  const filteredCustomers = useMemo(
    () =>
      activeCustomers.filter((c) =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase()),
      ),
    [activeCustomers, customerSearch],
  );

  const selectedCustomer = useMemo(
    () => activeCustomers.find((c) => c.id.toString() === customerId),
    [activeCustomers, customerId],
  );

  // Running totals
  const huskRunningTotal = useMemo(
    () => itemRows.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0),
    [itemRows],
  );
  const coconutRunningTotal = useMemo(
    () => coconutRows.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0),
    [coconutRows],
  );

  const resetForm = () => {
    setCustomerId("");
    setCustomerSearch("");
    setVehicleInput("");
    setVehicleSearch("");
    setNotes("");
    setItemRows([makeRow()]);
    setCoconutRows([makeCoconutRow()]);
    setEntryDate(new Date().toISOString().split("T")[0]);
    setShowDuplicateBanner(false);
  };

  const switchMode = (mode: EntryMode) => {
    setEntryMode(mode);
    setActiveCustomers(
      mode === "husk" ? getHuskCustomers() : getCoconutCustomers(),
    );
    resetForm();
  };

  // Husk row helpers
  const addRow = () => setItemRows((prev) => [...prev, makeRow()]);
  const removeRow = (id: number) =>
    setItemRows((prev) => prev.filter((r) => r.id !== id));
  const updateRow = (id: number, patch: Partial<Omit<ItemRow, "id">>) =>
    setItemRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    );

  // Coconut row helpers
  const addCoconutRow = () =>
    setCoconutRows((prev) => [...prev, makeCoconutRow()]);
  const removeCoconutRow = (id: number) =>
    setCoconutRows((prev) => prev.filter((r) => r.id !== id));
  const updateCoconutRow = (
    id: number,
    patch: Partial<Omit<CoconutRow, "id">>,
  ) =>
    setCoconutRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    );

  const handleHuskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !vehicleInput) {
      toast.error("Please fill all required fields");
      return;
    }
    for (const row of itemRows) {
      if (!row.quantity) {
        toast.error("Please enter quantity for all items");
        return;
      }
    }
    setIsSubmitting(true);
    try {
      const customerName = selectedCustomer?.name ?? "";
      await addHuskBatchEntry.mutateAsync({
        input: {
          customerId: BigInt(customerId),
          customerName,
          items: itemRows.map((r) => ({
            itemType: r.itemType,
            quantity: BigInt(r.quantity),
          })),
          vehicleNumber: vehicleInput,
          notes,
          createdByName: userName,
        },
        entryDateMs: isAdmin ? new Date(entryDate).getTime() : undefined,
      });
      // Audit log
      addAuditLog(userName, "Entry Created", `Husk - ${customerName}`);
      toast.success(
        `Entry saved with ${itemRows.length} item${itemRows.length > 1 ? "s" : ""}`,
      );
      resetForm();
    } catch (err) {
      toast.error(
        `Failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCoconutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !vehicleInput) {
      toast.error("Please fill all required fields");
      return;
    }
    for (const row of coconutRows) {
      if (!row.quantity) {
        toast.error("Please enter quantity for all items");
        return;
      }
      if (row.coconutType === CoconutType.others && !row.specifyType.trim()) {
        toast.error("Please specify the coconut type for all items");
        return;
      }
    }
    setIsSubmitting(true);
    try {
      const customerName = selectedCustomer?.name ?? "";
      await addCoconutBatchEntry.mutateAsync({
        input: {
          customerId: BigInt(customerId),
          customerName,
          items: coconutRows.map((r) => ({
            coconutType: r.coconutType,
            specifyType:
              r.coconutType === CoconutType.others ? r.specifyType : "",
            quantity: BigInt(r.quantity),
          })),
          vehicleNumber: vehicleInput,
          notes,
          createdByName: userName,
        },
        entryDateMs: isAdmin ? new Date(entryDate).getTime() : undefined,
      });
      // Audit log
      addAuditLog(userName, "Entry Created", `Coconut - ${customerName}`);
      toast.success(
        `Entry saved with ${coconutRows.length} item${coconutRows.length > 1 ? "s" : ""}`,
      );
      resetForm();
    } catch (err) {
      toast.error(
        `Failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="px-4 py-4">
        <h2 className="text-lg font-semibold mb-4" style={{ color: "#154A27" }}>
          {t("addEntry")}
        </h2>

        {/* Duplicate banner */}
        {showDuplicateBanner && (
          <div
            className="mb-3 flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-xs font-medium"
            style={{
              backgroundColor: "#f0fdf4",
              borderColor: "#154A27",
              color: "#154A27",
            }}
          >
            <span>
              <Copy className="inline h-3.5 w-3.5 mr-1" />
              {t("duplicate")} — {t("entryDate")} reset to today.
            </span>
            <button
              type="button"
              onClick={() => setShowDuplicateBanner(false)}
              className="shrink-0 opacity-60 hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Entry Type Tab Bar */}
        <div className="flex mb-4 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
          <button
            type="button"
            data-ocid="entry.husk_tab"
            onClick={() => switchMode("husk")}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-3 text-sm font-semibold transition-all duration-200 relative"
            style={
              entryMode === "husk"
                ? {
                    backgroundColor: "#154A27",
                    color: "#ffffff",
                    boxShadow: "inset 0 -3px 0 rgba(255,255,255,0.25)",
                  }
                : {
                    backgroundColor: "#f9fafb",
                    color: "#9ca3af",
                  }
            }
          >
            <img
              src="/assets/chatgpt_image_apr_1_2026_10_59_53_am-019d4787-a100-755d-a253-139059ad4aeb.png"
              alt="husk"
              className="w-6 h-6 object-contain inline-block"
            />
            <span className="tracking-wide">{t("huskEntry")}</span>
            {entryMode === "husk" && (
              <span
                className="absolute bottom-0 left-0 right-0 h-1 rounded-t-full"
                style={{ backgroundColor: "rgba(255,255,255,0.5)" }}
              />
            )}
          </button>

          <div className="w-px bg-gray-200" />

          <button
            type="button"
            data-ocid="entry.coconut_tab"
            onClick={() => switchMode("coconut")}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-3 text-sm font-semibold transition-all duration-200 relative"
            style={
              entryMode === "coconut"
                ? {
                    backgroundColor: "#8B5E3C",
                    color: "#ffffff",
                    boxShadow: "inset 0 -3px 0 rgba(255,255,255,0.25)",
                  }
                : {
                    backgroundColor: "#f9fafb",
                    color: "#9ca3af",
                  }
            }
          >
            <span className="text-xl leading-none">🥥</span>
            <span className="tracking-wide">{t("coconutEntry")}</span>
            {entryMode === "coconut" && (
              <span
                className="absolute bottom-0 left-0 right-0 h-1 rounded-t-full"
                style={{ backgroundColor: "rgba(255,255,255,0.5)" }}
              />
            )}
          </button>
        </div>

        <Card className="shadow-card border-0">
          <CardContent className="p-4">
            {entryMode === "husk" ? (
              <form onSubmit={handleHuskSubmit} className="space-y-4">
                {/* Customer */}
                <CustomerField
                  customers={filteredCustomers}
                  customerSearch={customerSearch}
                  selectedCustomer={selectedCustomer}
                  customerDropOpen={customerDropOpen}
                  onSearchChange={(val) => {
                    setCustomerSearch(val);
                    setCustomerId("");
                    setCustomerDropOpen(true);
                  }}
                  onFocus={() => setCustomerDropOpen(true)}
                  onSelect={(id, name) => {
                    setCustomerId(id);
                    setCustomerSearch(name);
                    setCustomerDropOpen(false);
                  }}
                  onAddCustomer={() => setAddCustOpen(true)}
                  t={t}
                />

                {/* Vehicle */}
                <VehicleField
                  filteredVehicles={filteredVehicles}
                  vehicleInput={vehicleInput}
                  vehicleSearch={vehicleSearch}
                  vehicleDropOpen={vehicleDropOpen}
                  onVehicleChange={(val) => {
                    setVehicleSearch(val);
                    setVehicleInput(val);
                    setVehicleDropOpen(true);
                  }}
                  onFocus={() => setVehicleDropOpen(true)}
                  onSelect={(vn) => {
                    setVehicleInput(vn);
                    setVehicleSearch(vn);
                    setVehicleDropOpen(false);
                  }}
                  t={t}
                />

                {/* Item Rows */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">
                      {t("itemType")} &amp; {t("quantity")} *
                    </Label>
                    {huskRunningTotal > 0 && (
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: "#BFD8A8", color: "#154A27" }}
                      >
                        {t("totalQuantity")}: {huskRunningTotal} Nos
                      </span>
                    )}
                  </div>
                  {itemRows.map((row, index) => (
                    <div
                      key={row.id}
                      data-ocid={`entry.item.${index + 1}`}
                      className="flex gap-2 items-start bg-green-50 border border-green-100 rounded-lg p-3"
                    >
                      <div className="flex-1 space-y-2">
                        <Select
                          value={row.itemType}
                          onValueChange={(v) =>
                            updateRow(row.id, { itemType: v as ItemType })
                          }
                        >
                          <SelectTrigger
                            data-ocid={`entry.select.${index + 1}`}
                            className="border-input bg-white h-9 text-sm"
                          >
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
                          data-ocid={`entry.input.${index + 1}`}
                          type="number"
                          min="1"
                          placeholder="Qty (Nos)"
                          value={row.quantity}
                          onChange={(e) =>
                            updateRow(row.id, { quantity: e.target.value })
                          }
                          className="border-input bg-white h-9 text-sm"
                        />
                      </div>
                      {itemRows.length > 1 && (
                        <button
                          type="button"
                          data-ocid={`entry.delete_button.${index + 1}`}
                          onClick={() => removeRow(row.id)}
                          className="mt-1 p-1 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          aria-label={t("delete")}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    data-ocid="entry.add_button"
                    onClick={addRow}
                    className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border border-dashed transition-colors"
                    style={{ color: "#154A27", borderColor: "#154A27" }}
                  >
                    <Plus className="h-4 w-4" />
                    {t("addItem")}
                  </button>
                </div>

                {/* Admin: Entry Date */}
                {isAdmin && (
                  <AdminDatePicker
                    value={entryDate}
                    onChange={setEntryDate}
                    todayStr={todayStr}
                    t={t}
                  />
                )}

                {/* Notes */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">
                    {t("notes_label")}
                  </Label>
                  <Textarea
                    data-ocid="entry.textarea"
                    placeholder={`${t("notes_label")}...`}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="border-input resize-none"
                  />
                </div>

                <Button
                  data-ocid="entry.submit_button"
                  type="submit"
                  className="w-full text-white font-semibold"
                  style={{ backgroundColor: "#154A27" }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("loading")}
                    </>
                  ) : (
                    t("submit")
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleCoconutSubmit} className="space-y-4">
                {/* Customer */}
                <CustomerField
                  customers={filteredCustomers}
                  customerSearch={customerSearch}
                  selectedCustomer={selectedCustomer}
                  customerDropOpen={customerDropOpen}
                  onSearchChange={(val) => {
                    setCustomerSearch(val);
                    setCustomerId("");
                    setCustomerDropOpen(true);
                  }}
                  onFocus={() => setCustomerDropOpen(true)}
                  onSelect={(id, name) => {
                    setCustomerId(id);
                    setCustomerSearch(name);
                    setCustomerDropOpen(false);
                  }}
                  onAddCustomer={() => setAddCustOpen(true)}
                  t={t}
                />

                {/* Coconut Item Rows */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">
                      {t("coconutType")} &amp; {t("quantity")} *
                    </Label>
                    {coconutRunningTotal > 0 && (
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: "#E8D5C4", color: "#8B5E3C" }}
                      >
                        {t("totalQuantity")}: {coconutRunningTotal} Nos
                      </span>
                    )}
                  </div>
                  {coconutRows.map((row, index) => (
                    <div
                      key={row.id}
                      data-ocid={`entry.coconut_item.${index + 1}`}
                      className="flex gap-2 items-start bg-amber-50 border border-amber-100 rounded-lg p-3"
                    >
                      <div className="flex-1 space-y-2">
                        <Select
                          value={row.coconutType}
                          onValueChange={(v) =>
                            updateCoconutRow(row.id, {
                              coconutType: v as CoconutType,
                            })
                          }
                        >
                          <SelectTrigger
                            data-ocid={`entry.coconut_select.${index + 1}`}
                            className="border-input bg-white h-9 text-sm"
                          >
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
                            data-ocid={`entry.specify_input.${index + 1}`}
                            placeholder={t("specifyType")}
                            value={row.specifyType}
                            onChange={(e) =>
                              updateCoconutRow(row.id, {
                                specifyType: e.target.value,
                              })
                            }
                            className="border-input bg-white h-9 text-sm"
                          />
                        )}
                        <Input
                          data-ocid={`entry.input.${index + 1}`}
                          type="number"
                          min="1"
                          placeholder="Qty (Nos)"
                          value={row.quantity}
                          onChange={(e) =>
                            updateCoconutRow(row.id, {
                              quantity: e.target.value,
                            })
                          }
                          className="border-input bg-white h-9 text-sm"
                        />
                      </div>
                      {coconutRows.length > 1 && (
                        <button
                          type="button"
                          data-ocid={`entry.coconut_delete.${index + 1}`}
                          onClick={() => removeCoconutRow(row.id)}
                          className="mt-1 p-1 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          aria-label={t("delete")}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    data-ocid="entry.coconut_add_button"
                    onClick={addCoconutRow}
                    className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border border-dashed transition-colors"
                    style={{ color: "#8B5E3C", borderColor: "#8B5E3C" }}
                  >
                    <Plus className="h-4 w-4" />
                    {t("addItem")}
                  </button>
                </div>

                {/* Vehicle */}
                <VehicleField
                  filteredVehicles={filteredVehicles}
                  vehicleInput={vehicleInput}
                  vehicleSearch={vehicleSearch}
                  vehicleDropOpen={vehicleDropOpen}
                  onVehicleChange={(val) => {
                    setVehicleSearch(val);
                    setVehicleInput(val);
                    setVehicleDropOpen(true);
                  }}
                  onFocus={() => setVehicleDropOpen(true)}
                  onSelect={(vn) => {
                    setVehicleInput(vn);
                    setVehicleSearch(vn);
                    setVehicleDropOpen(false);
                  }}
                  t={t}
                />

                {/* Admin: Entry Date */}
                {isAdmin && (
                  <AdminDatePicker
                    value={entryDate}
                    onChange={setEntryDate}
                    todayStr={todayStr}
                    t={t}
                  />
                )}

                {/* Notes */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">
                    {t("notes_label")}
                  </Label>
                  <Textarea
                    data-ocid="entry.textarea"
                    placeholder={`${t("notes_label")}...`}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="border-input resize-none"
                  />
                </div>

                <Button
                  data-ocid="entry.submit_button"
                  type="submit"
                  className="w-full text-white font-semibold"
                  style={{ backgroundColor: "#8B5E3C" }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("loading")}
                    </>
                  ) : (
                    t("submit")
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={addCustOpen} onOpenChange={setAddCustOpen}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>{t("addCustomer")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">{t("name")} *</Label>
              <Input
                placeholder={t("name")}
                value={newCustName}
                onChange={(e) => setNewCustName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">{t("phone")}</Label>
              <Input
                placeholder={t("phone")}
                value={newCustPhone}
                onChange={(e) => setNewCustPhone(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">{t("location")}</Label>
              <Input
                placeholder={t("location")}
                value={newCustLocation}
                onChange={(e) => setNewCustLocation(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddCustOpen(false)}>
              {t("cancel")}
            </Button>
            <Button
              onClick={handleAddCustomer}
              style={{
                backgroundColor: entryMode === "husk" ? "#154A27" : "#8B5E3C",
              }}
              className="text-white"
            >
              {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CustomerField({
  customers,
  customerSearch,
  selectedCustomer,
  customerDropOpen,
  onSearchChange,
  onFocus,
  onSelect,
  onAddCustomer,
  t,
}: {
  customers: Array<{ id: number; name: string }>;
  customerSearch: string;
  selectedCustomer?: { name: string };
  customerDropOpen: boolean;
  onSearchChange: (val: string) => void;
  onFocus: () => void;
  onSelect: (id: string, name: string) => void;
  onAddCustomer: () => void;
  t: (key: TranslationKeys) => string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold">{t("customer")} *</Label>
        <button
          type="button"
          onClick={onAddCustomer}
          className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md border border-dashed transition-colors"
          style={{ color: "#154A27", borderColor: "#154A27" }}
        >
          <Plus className="h-3 w-3" />
          {t("addCustomer")}
        </button>
      </div>
      <div className="relative">
        <Input
          data-ocid="entry.search_input"
          placeholder={`${t("search")} ${t("customer")}...`}
          value={customerSearch || selectedCustomer?.name || ""}
          onFocus={onFocus}
          onChange={(e) => onSearchChange(e.target.value)}
          className="border-input"
        />
        {customerDropOpen && customers.length > 0 && (
          <div className="absolute z-20 top-full left-0 right-0 bg-white border border-border rounded-lg shadow-card-hover max-h-40 overflow-y-auto mt-1">
            {customers.map((c) => (
              <button
                key={c.id}
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                onClick={() => onSelect(c.id.toString(), c.name)}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function VehicleField({
  filteredVehicles,
  vehicleInput,
  vehicleSearch,
  vehicleDropOpen,
  onVehicleChange,
  onFocus,
  onSelect,
  t,
}: {
  filteredVehicles: Array<{
    id: bigint;
    vehicleNumber: string;
    usageCount: bigint;
  }>;
  vehicleInput: string;
  vehicleSearch: string;
  vehicleDropOpen: boolean;
  onVehicleChange: (val: string) => void;
  onFocus: () => void;
  onSelect: (vn: string) => void;
  t: (key: TranslationKeys) => string;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-semibold">{t("vehicleNumber")} *</Label>
      <div className="relative">
        <Input
          data-ocid="entry.vehicle_input"
          placeholder={`${t("search")} or type new...`}
          value={vehicleInput || vehicleSearch}
          onFocus={onFocus}
          onChange={(e) => onVehicleChange(e.target.value)}
          className="border-input"
        />
        {vehicleDropOpen && filteredVehicles.length > 0 && (
          <div className="absolute z-20 top-full left-0 right-0 bg-white border border-border rounded-lg shadow-card-hover max-h-40 overflow-y-auto mt-1">
            {filteredVehicles.map((v) => (
              <button
                key={v.id.toString()}
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex justify-between items-center transition-colors"
                onClick={() => onSelect(v.vehicleNumber)}
              >
                <span>{v.vehicleNumber}</span>
                <span className="text-xs text-muted-foreground">
                  {v.usageCount.toString()}x
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Admin Date Picker ───────────────────────────────────────────────
function AdminDatePicker({
  value,
  onChange,
  todayStr,
  t,
}: {
  value: string;
  onChange: (v: string) => void;
  todayStr: string;
  t: (key: TranslationKeys) => string;
}) {
  const [open, setOpen] = useState(false);

  const selected = value ? new Date(`${value}T00:00:00`) : undefined;
  const today = new Date(`${todayStr}T00:00:00`);

  const displayLabel = selected
    ? selected.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : t("entryDate");

  const isToday = value === todayStr;
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];
  const isYesterday = value === yesterdayStr;

  const friendlyLabel = isToday
    ? `Today — ${selected?.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`
    : isYesterday
      ? `Yesterday — ${selected?.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`
      : displayLabel;

  return (
    <div className="space-y-1">
      <Label className="text-xs font-semibold flex items-center gap-1">
        <CalendarDays className="h-3.5 w-3.5" />
        {t("entryDate")}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            data-ocid="entry.date_input"
            className="w-full flex items-center justify-between px-3 py-2 rounded-md border border-input bg-white text-sm transition-colors hover:bg-gray-50"
            style={{ minHeight: "2.25rem" }}
          >
            <span className="font-medium">{friendlyLabel}</span>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(date) => {
              if (date) {
                onChange(date.toISOString().split("T")[0]);
              }
              setOpen(false);
            }}
            disabled={(date) => date > today}
            defaultMonth={selected ?? today}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
