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
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CoconutType, ItemType } from "../backend";
import {
  useAddCoconutBatchEntry,
  useAddHuskBatchEntry,
  useGetAllCustomers,
  useGetAllVehicles,
} from "../hooks/useQueries";
import { type TranslationKeys, useI18n } from "../i18n";

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
function makeRow(): ItemRow {
  return { id: rowIdCounter++, itemType: ItemType.husk, quantity: "" };
}
function makeCoconutRow(): CoconutRow {
  return {
    id: rowIdCounter++,
    coconutType: CoconutType.rasi,
    specifyType: "",
    quantity: "",
  };
}

type EntryMode = "husk" | "coconut";

export default function NewEntry({ userName }: { userName: string }) {
  const { t } = useI18n();
  const { data: customers } = useGetAllCustomers();
  const { data: vehicles } = useGetAllVehicles();
  const addHuskBatchEntry = useAddHuskBatchEntry();
  const addCoconutBatchEntry = useAddCoconutBatchEntry();

  const [entryMode, setEntryMode] = useState<EntryMode>("husk");

  // Shared fields
  const [customerId, setCustomerId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerDropOpen, setCustomerDropOpen] = useState(false);
  const [vehicleInput, setVehicleInput] = useState("");
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [vehicleDropOpen, setVehicleDropOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Husk-specific
  const [itemRows, setItemRows] = useState<ItemRow[]>([makeRow()]);

  // Coconut-specific
  const [coconutRows, setCoconutRows] = useState<CoconutRow[]>([
    makeCoconutRow(),
  ]);

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
      (customers ?? []).filter((c) =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase()),
      ),
    [customers, customerSearch],
  );

  const selectedCustomer = useMemo(
    () => (customers ?? []).find((c) => c.id.toString() === customerId),
    [customers, customerId],
  );

  const resetForm = () => {
    setCustomerId("");
    setCustomerSearch("");
    setVehicleInput("");
    setVehicleSearch("");
    setNotes("");
    setItemRows([makeRow()]);
    setCoconutRows([makeCoconutRow()]);
  };

  const switchMode = (mode: EntryMode) => {
    setEntryMode(mode);
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
      await addHuskBatchEntry.mutateAsync({
        customerId: BigInt(customerId),
        customerName: selectedCustomer?.name ?? "",
        items: itemRows.map((r) => ({
          itemType: r.itemType,
          quantity: BigInt(r.quantity),
        })),
        vehicleNumber: vehicleInput,
        notes,
        createdByName: userName,
      });
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
      await addCoconutBatchEntry.mutateAsync({
        customerId: BigInt(customerId),
        customerName: selectedCustomer?.name ?? "",
        items: coconutRows.map((r) => ({
          coconutType: r.coconutType,
          specifyType:
            r.coconutType === CoconutType.others ? r.specifyType : "",
          quantity: BigInt(r.quantity),
        })),
        vehicleNumber: vehicleInput,
        notes,
        createdByName: userName,
      });
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
    <div className="px-4 py-4">
      <h2 className="text-lg font-semibold mb-4" style={{ color: "#154A27" }}>
        {t("addEntry")}
      </h2>

      {/* Entry Type Toggle */}
      <div className="flex gap-2 mb-4 p-1 bg-gray-100 rounded-xl">
        <button
          type="button"
          data-ocid="entry.husk_tab"
          onClick={() => switchMode("husk")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            entryMode === "husk"
              ? "bg-white shadow-sm text-green-800"
              : "text-gray-500 hover:text-gray-700"
          }`}
          style={entryMode === "husk" ? { color: "#154A27" } : {}}
        >
          🌿 {t("huskEntry")}
        </button>
        <button
          type="button"
          data-ocid="entry.coconut_tab"
          onClick={() => switchMode("coconut")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            entryMode === "coconut"
              ? "bg-white shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
          style={entryMode === "coconut" ? { color: "#8B5E3C" } : {}}
        >
          🥥 {t("coconutEntry")}
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
                <Label className="text-xs font-semibold">
                  {t("itemType")} &amp; {t("quantity")} *
                </Label>
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
                t={t}
              />

              {/* Coconut Item Rows */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">
                  {t("coconutType")} &amp; {t("quantity")} *
                </Label>
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
                          updateCoconutRow(row.id, { quantity: e.target.value })
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
  );
}

// Shared subcomponents
function CustomerField({
  customers,
  customerSearch,
  selectedCustomer,
  customerDropOpen,
  onSearchChange,
  onFocus,
  onSelect,
  t,
}: {
  customers: Array<{ id: bigint; name: string }>;
  customerSearch: string;
  selectedCustomer?: { name: string };
  customerDropOpen: boolean;
  onSearchChange: (val: string) => void;
  onFocus: () => void;
  onSelect: (id: string, name: string) => void;
  t: (key: TranslationKeys) => string;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-semibold">{t("customer")} *</Label>
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
                key={c.id.toString()}
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
