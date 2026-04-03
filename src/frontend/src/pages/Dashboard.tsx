import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  type CoconutBatchEntry,
  CoconutType,
  type HuskBatchEntry,
  ItemType,
} from "../backend";
import { useAuthContext } from "../hooks/AuthContext";
import {
  getAllLocalCoconutEntries,
  getAllLocalHuskEntries,
} from "../hooks/useLocalEntries";
import { useGetAllCustomers, useGetAllEntries } from "../hooks/useQueries";
import { useI18n } from "../i18n";

function nsToDate(ns: bigint): Date {
  return new Date(Number(ns / 1_000_000n));
}

function nsToDateTime(ns: bigint): string {
  const d = new Date(Number(ns / 1_000_000n));
  return `${d.toLocaleDateString("en-IN")} ${d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
}

const ITEM_TYPE_COLORS: Record<string, string> = {
  [ItemType.husk]: "#154A27",
  [ItemType.dry]: "#2d7a4f",
  [ItemType.wet]: "#4e9e6e",
  [ItemType.both]: "#7dc4a0",
  [ItemType.motta]: "#BFD8A8",
  [ItemType.others]: "#a8c590",
};

const ITEM_TYPE_LABELS: Record<string, string> = {
  [ItemType.husk]: "Husk",
  [ItemType.dry]: "Dry",
  [ItemType.wet]: "Wet",
  [ItemType.both]: "Both",
  [ItemType.motta]: "Motta",
  [ItemType.others]: "Others",
};

const COCONUT_COLORS: Record<string, string> = {
  [CoconutType.rasi]: "#8B5E3C",
  [CoconutType.tallu]: "#A0714F",
  [CoconutType.others]: "#7A4F30",
};

const COCONUT_TYPE_LABELS: Record<string, string> = {
  [CoconutType.rasi]: "Rasi",
  [CoconutType.tallu]: "Tallu",
  [CoconutType.others]: "Others",
};

type PaymentStatus = { paid: null } | { pending: null };
type HuskEntryFull = HuskBatchEntry & {
  paymentStatus?: PaymentStatus;
  paymentAmount?: [] | [bigint];
  lastModifiedAt?: [] | [bigint];
  lastModifiedByName?: [] | [string];
};
type CoconutEntryFull = CoconutBatchEntry & {
  paymentStatus?: PaymentStatus;
  paymentAmount?: [] | [bigint];
  lastModifiedAt?: [] | [bigint];
  lastModifiedByName?: [] | [string];
};

function entryIsPaid(entry: HuskEntryFull | CoconutEntryFull): boolean {
  if (!entry.paymentStatus) return false;
  return "paid" in entry.paymentStatus;
}

function PaymentBadge({ entry }: { entry: HuskEntryFull | CoconutEntryFull }) {
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

export default function Dashboard({
  userName,
  onNavigateToEntry,
  onNavigateToEdit,
}: {
  userName: string;
  onNavigateToEntry?: (mode: "husk" | "coconut") => void;
  onNavigateToEdit?: (entryId: bigint, entryType: "husk" | "coconut") => void;
}) {
  const { t } = useI18n();
  const { data: entries, isLoading: entriesLoading } = useGetAllEntries();
  const { data: customers } = useGetAllCustomers();
  const { isAdmin, user } = useAuthContext();
  const [recentTab, setRecentTab] = useState<"husk" | "coconut">("husk");

  // Detail view state
  const [detailHusk, setDetailHusk] = useState<HuskEntryFull | null>(null);
  const [detailCoconut, setDetailCoconut] = useState<CoconutEntryFull | null>(
    null,
  );

  const today = new Date();
  const todayStr = today.toDateString();

  const todayEntries = useMemo(
    () =>
      (entries ?? []).filter(
        (e) => nsToDate(e.createdAt).toDateString() === todayStr,
      ),
    [entries, todayStr],
  );

  const todayQty = useMemo(
    () => todayEntries.reduce((sum, e) => sum + Number(e.quantity), 0),
    [todayEntries],
  );

  const topVehicle = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of todayEntries) {
      counts[e.vehicleNumber] = (counts[e.vehicleNumber] ?? 0) + 1;
    }
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] ?? "\u2014";
  }, [todayEntries]);

  const last7Days = useMemo(() => {
    const days: { date: string; qty: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toDateString();
      const qty = (entries ?? [])
        .filter((e) => nsToDate(e.createdAt).toDateString() === dayStr)
        .reduce((sum, e) => sum + Number(e.quantity), 0);
      days.push({
        date: d.toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
        qty,
      });
    }
    return days;
  }, [entries]);

  const recentEntries = useMemo(
    () =>
      [...(entries ?? [])]
        .filter((e) =>
          recentTab === "coconut"
            ? e.itemType === "coconut"
            : e.itemType !== "coconut",
        )
        .sort((a, b) => Number(b.createdAt - a.createdAt))
        .slice(0, 10),
    [entries, recentTab],
  );

  // Open detail: look up full entry from local storage
  const openDetail = (entryId: bigint, entryType: "husk" | "coconut") => {
    if (entryType === "husk") {
      const full = getAllLocalHuskEntries().find((e) => e.id === entryId) as
        | HuskEntryFull
        | undefined;
      if (full) setDetailHusk(full);
    } else {
      const full = getAllLocalCoconutEntries().find((e) => e.id === entryId) as
        | CoconutEntryFull
        | undefined;
      if (full) setDetailCoconut(full);
    }
  };

  const kpis = [
    { label: t("entriesCount"), value: todayEntries.length.toString() },
    { label: `${t("totalQuantity")} ${t("today")}`, value: `${todayQty} Nos` },
    { label: t("topVehicle"), value: topVehicle },
    { label: t("totalCustomers"), value: (customers?.length ?? 0).toString() },
  ];

  return (
    <div className="px-4 py-4 space-y-5">
      <div>
        <h1 className="text-lg font-semibold" style={{ color: "#154A27" }}>
          {t("welcome")}, {userName}!
        </h1>
        <p className="text-sm text-muted-foreground">
          {today.toLocaleDateString("en-IN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {onNavigateToEntry && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">
            {t("quickEntry")}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              data-ocid="dashboard.husk_entry.button"
              onClick={() => onNavigateToEntry("husk")}
              className="flex flex-col items-center justify-center py-4 rounded-xl shadow-sm active:scale-95 transition-all text-white font-semibold text-sm gap-1"
              style={{ backgroundColor: "#154A27" }}
            >
              <img
                src="/assets/chatgpt_image_apr_1_2026_10_59_53_am-019d4787-a100-755d-a253-139059ad4aeb.png"
                alt="husk"
                className="w-6 h-6 object-contain inline-block"
              />
              <span>{t("huskEntry")}</span>
            </button>
            <button
              type="button"
              data-ocid="dashboard.coconut_entry.button"
              onClick={() => onNavigateToEntry("coconut")}
              className="flex flex-col items-center justify-center py-4 rounded-xl shadow-sm active:scale-95 transition-all text-white font-semibold text-sm gap-1"
              style={{ backgroundColor: "#8B5E3C" }}
            >
              <span className="text-xl">🥥</span>
              <span>{t("coconutEntry")}</span>
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="shadow-card border-0">
            <CardContent className="p-3">
              {entriesLoading ? (
                <Skeleton className="h-8 w-full" />
              ) : (
                <>
                  <p className="text-xs text-muted-foreground mb-1">
                    {kpi.label}
                  </p>
                  <p
                    className="text-xl font-bold truncate"
                    style={{ color: "#154A27" }}
                  >
                    {kpi.value}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-card border-0">
        <CardContent className="p-3">
          <p className="text-xs font-semibold text-muted-foreground mb-3">
            {t("last7Days")}
          </p>
          {entriesLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={last7Days}>
                <defs>
                  <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#154A27" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#154A27" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 9 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 8 }}
                  formatter={(v) => [`${v} Nos`, t("quantity")]}
                />
                <Area
                  type="monotone"
                  dataKey="qty"
                  stroke="#154A27"
                  strokeWidth={2}
                  fill="url(#greenGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div>
        <p className="text-sm font-semibold mb-3" style={{ color: "#154A27" }}>
          {t("recentEntries")}
        </p>

        {/* Husk / Coconut tab bar */}
        <div
          className="flex rounded-xl overflow-hidden mb-3 border"
          style={{ borderColor: "#e5e7eb" }}
        >
          <button
            type="button"
            data-ocid="dashboard.husk_recent.tab"
            onClick={() => setRecentTab("husk")}
            className="flex-1 py-2 text-sm font-semibold transition-all"
            style={
              recentTab === "husk"
                ? { backgroundColor: "#154A27", color: "#fff" }
                : { backgroundColor: "#fff", color: "#6b7280" }
            }
          >
            🌿 {t("husk")}
          </button>
          <button
            type="button"
            data-ocid="dashboard.coconut_recent.tab"
            onClick={() => setRecentTab("coconut")}
            className="flex-1 py-2 text-sm font-semibold transition-all"
            style={
              recentTab === "coconut"
                ? { backgroundColor: "#8B5E3C", color: "#fff" }
                : { backgroundColor: "#fff", color: "#6b7280" }
            }
          >
            🥥 {t("coconut")}
          </button>
        </div>

        {entriesLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : recentEntries.length === 0 ? (
          <Card className="shadow-card border-0">
            <CardContent
              className="p-4 text-center text-sm text-muted-foreground"
              data-ocid="entries.empty_state"
            >
              {t("noData")}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentEntries.map((entry, idx) => (
              <Card
                key={entry.id.toString()}
                className="shadow-card border-0 cursor-pointer active:scale-[0.99] transition-all hover:shadow-md"
                data-ocid={`dashboard.recent_entry.${idx + 1}`}
                onClick={() =>
                  openDetail(
                    entry.id,
                    recentTab === "coconut" ? "coconut" : "husk",
                  )
                }
              >
                <CardContent className="p-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {entry.customerName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {entry.vehicleNumber} · {nsToDateTime(entry.createdAt)}
                    </p>
                    {entry.createdByName && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        👤 {entry.createdByName}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge
                      className="text-[10px] font-semibold text-white"
                      style={{
                        backgroundColor:
                          recentTab === "coconut"
                            ? "#8B5E3C"
                            : (ITEM_TYPE_COLORS[entry.itemType] ?? "#154A27"),
                      }}
                    >
                      {entry.itemType}
                    </Badge>
                    <span
                      className="text-xs font-bold"
                      style={{
                        color: recentTab === "coconut" ? "#8B5E3C" : "#154A27",
                      }}
                    >
                      {entry.quantity.toString()} Nos
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Husk Detail Sheet */}
      <Sheet
        open={!!detailHusk}
        onOpenChange={(o) => !o && setDetailHusk(null)}
      >
        <SheetContent
          side="bottom"
          className="max-w-[430px] mx-auto rounded-t-2xl max-h-[90vh] overflow-y-auto"
          data-ocid="dashboard.husk_detail.sheet"
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
                  {(
                    detailHusk.items as Array<{
                      itemType: string;
                      quantity: bigint;
                    }>
                  ).map((item, itemIdx) => (
                    <Badge
                      key={`detail-husk-${item.itemType}-${itemIdx}`}
                      className="text-xs font-medium text-white px-2.5 py-1"
                      style={{
                        backgroundColor:
                          ITEM_TYPE_COLORS[item.itemType] ?? "#154A27",
                      }}
                    >
                      {ITEM_TYPE_LABELS[item.itemType] ?? item.itemType} –{" "}
                      {item.quantity.toString()}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm font-bold" style={{ color: "#154A27" }}>
                  {t("totalQuantity")}:{" "}
                  {(detailHusk.items as Array<{ quantity: bigint }>).reduce(
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

              {/* Action buttons */}
              <div className="flex gap-2 pt-2">
                {(isAdmin || detailHusk.createdByName === user?.username) &&
                  onNavigateToEdit && (
                    <Button
                      data-ocid="dashboard.husk_detail.edit_button"
                      className="flex-1 text-white"
                      style={{ backgroundColor: "#154A27" }}
                      onClick={() => {
                        setDetailHusk(null);
                        onNavigateToEdit(detailHusk.id, "husk");
                      }}
                    >
                      <Pencil size={14} className="mr-1.5" /> {t("edit")}
                    </Button>
                  )}
                <Button
                  data-ocid="dashboard.husk_detail.close_button"
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
          data-ocid="dashboard.coconut_detail.sheet"
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
                  {(
                    detailCoconut.items as Array<{
                      coconutType: string;
                      specifyType: string;
                      quantity: bigint;
                    }>
                  ).map((item, itemIdx) => (
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
                        : (COCONUT_TYPE_LABELS[item.coconutType] ??
                          item.coconutType)}{" "}
                      – {item.quantity.toString()}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm font-bold" style={{ color: "#8B5E3C" }}>
                  {t("totalQuantity")}:{" "}
                  {(detailCoconut.items as Array<{ quantity: bigint }>).reduce(
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

              {/* Action buttons */}
              <div className="flex gap-2 pt-2">
                {(isAdmin || detailCoconut.createdByName === user?.username) &&
                  onNavigateToEdit && (
                    <Button
                      data-ocid="dashboard.coconut_detail.edit_button"
                      className="flex-1 text-white"
                      style={{ backgroundColor: "#8B5E3C" }}
                      onClick={() => {
                        setDetailCoconut(null);
                        onNavigateToEdit(detailCoconut.id, "coconut");
                      }}
                    >
                      <Pencil size={14} className="mr-1.5" /> {t("edit")}
                    </Button>
                  )}
                <Button
                  data-ocid="dashboard.coconut_detail.close_button"
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

      <footer className="text-center text-xs text-muted-foreground pt-2 pb-4">
        \u00a9 {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          className="underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
