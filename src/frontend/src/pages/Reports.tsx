import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart2, Download } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  type CoconutBatchReportFilter,
  CoconutType,
  ItemType,
  type ReportFilter,
} from "../backend";
import { useAuthContext } from "../hooks/AuthContext";
import {
  useGetAllCustomers,
  useGetCoconutBatchReport,
  useGetHuskBatchReport,
} from "../hooks/useQueries";
import { useI18n } from "../i18n";

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

const CHART_COLORS: Record<string, string> = {
  [ItemType.husk]: "#154A27",
  [ItemType.dry]: "#2d7a4f",
  [ItemType.wet]: "#4e9e6e",
  [ItemType.both]: "#7dc4a0",
  [ItemType.motta]: "#a8c590",
  [ItemType.others]: "#BFD8A8",
};

const COCONUT_CHART_COLORS: Record<string, string> = {
  [CoconutType.rasi]: "#8B5E3C",
  [CoconutType.tallu]: "#A0714F",
  [CoconutType.others]: "#7A4F30",
};

function dateToNs(dateStr: string): bigint {
  return BigInt(new Date(dateStr).getTime()) * 1_000_000n;
}

function nsToDate(ns: bigint): string {
  const ms = Number(ns / 1_000_000n);
  return new Date(ms).toLocaleDateString();
}

function nsToYearMonth(ns: bigint): string {
  const ms = Number(ns / 1_000_000n);
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatYearMonth(ym: string): string {
  const [year, month] = ym.split("-");
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return `${months[Number(month) - 1]} ${year}`;
}

type ReportMode = "husk" | "coconut";
type PaymentFilterMode = "" | "paid" | "pending";

function exportToCSV(
  mode: ReportMode,
  huskReport: ReturnType<typeof useGetHuskBatchReport>["data"],
  coconutReport: ReturnType<typeof useGetCoconutBatchReport>["data"],
  isAdmin: boolean,
) {
  const rows: string[][] = [];

  if (mode === "husk") {
    const headers = ["Date", "Customer", "Vehicle", "Item Type", "Quantity"];
    if (isAdmin) headers.push("Payment Status", "Payment Amount (₹)");
    rows.push(headers);
    for (const entry of huskReport?.entries ?? []) {
      const date = entry.createdAt ? nsToDate(entry.createdAt as bigint) : "";
      const paymentStatus = isAdmin
        ? (entry as Record<string, unknown>).paymentStatus !== undefined
          ? typeof (entry as Record<string, unknown>).paymentStatus ===
              "object" &&
            (entry as Record<string, unknown>).paymentStatus !== null
            ? "paid" in
              ((entry as Record<string, unknown>).paymentStatus as object)
              ? "Paid"
              : "Pending"
            : ""
          : ""
        : "";
      const paymentAmount = isAdmin
        ? String(
            (entry as Record<string, unknown>).paymentAmount !== undefined
              ? (entry as Record<string, unknown>).paymentAmount
              : "",
          )
        : "";
      for (const item of entry.items) {
        const row = [
          date,
          entry.customerName,
          entry.vehicleNumber,
          ITEM_TYPE_LABELS[item.itemType] ?? item.itemType,
          item.quantity.toString(),
        ];
        if (isAdmin) row.push(paymentStatus, paymentAmount);
        rows.push(row);
      }
    }
  } else {
    const headers = ["Date", "Customer", "Vehicle", "Coconut Type", "Quantity"];
    if (isAdmin) headers.push("Payment Status", "Payment Amount (₹)");
    rows.push(headers);
    for (const entry of coconutReport?.entries ?? []) {
      const date = entry.createdAt ? nsToDate(entry.createdAt as bigint) : "";
      const paymentStatus = isAdmin
        ? (entry as Record<string, unknown>).paymentStatus !== undefined
          ? typeof (entry as Record<string, unknown>).paymentStatus ===
              "object" &&
            (entry as Record<string, unknown>).paymentStatus !== null
            ? "paid" in
              ((entry as Record<string, unknown>).paymentStatus as object)
              ? "Paid"
              : "Pending"
            : ""
          : ""
        : "";
      const paymentAmount = isAdmin
        ? String(
            (entry as Record<string, unknown>).paymentAmount !== undefined
              ? (entry as Record<string, unknown>).paymentAmount
              : "",
          )
        : "";
      for (const item of entry.items) {
        const typeLabel =
          item.coconutType === CoconutType.others && item.specifyType
            ? item.specifyType
            : (COCONUT_TYPE_LABELS[item.coconutType] ?? item.coconutType);
        const row = [
          date,
          entry.customerName,
          entry.vehicleNumber,
          typeLabel,
          item.quantity.toString(),
        ];
        if (isAdmin) row.push(paymentStatus, paymentAmount);
        rows.push(row);
      }
    }
  }

  const csvContent = rows
    .map((r) =>
      r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `acw-${mode}-report-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const { t } = useI18n();
  const { data: customers } = useGetAllCustomers();
  const { isAdmin } = useAuthContext();

  const [reportMode, setReportMode] = useState<ReportMode>("husk");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [runQuery, setRunQuery] = useState(false);
  const [itemType, setItemType] = useState("");
  const [coconutType, setCoconutType] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilterMode>("");
  const [showMonthlySummary, setShowMonthlySummary] = useState(false);

  const paymentStatusFilter: [] | [{ paid: null } | { pending: null }] =
    useMemo(() => {
      if (paymentFilter === "paid") return [{ paid: null }];
      if (paymentFilter === "pending") return [{ pending: null }];
      return [];
    }, [paymentFilter]);

  const huskFilter: ReportFilter = useMemo(() => {
    const f: ReportFilter = {};
    if (startDate) f.startDate = dateToNs(startDate);
    if (endDate) f.endDate = dateToNs(`${endDate}T23:59:59`);
    if (customerId) f.customerId = BigInt(customerId);
    if (vehicleNumber) f.vehicleNumber = vehicleNumber;
    if (itemType) f.itemType = itemType as ItemType;
    if (paymentStatusFilter.length > 0)
      (f as Record<string, unknown>).paymentStatus = paymentStatusFilter;
    return f;
  }, [
    startDate,
    endDate,
    customerId,
    vehicleNumber,
    itemType,
    paymentStatusFilter,
  ]);

  const coconutFilter: CoconutBatchReportFilter = useMemo(() => {
    const f: CoconutBatchReportFilter = {};
    if (startDate) f.startDate = dateToNs(startDate);
    if (endDate) f.endDate = dateToNs(`${endDate}T23:59:59`);
    if (customerId) f.customerId = BigInt(customerId);
    if (vehicleNumber) f.vehicleNumber = vehicleNumber;
    if (coconutType) f.coconutType = coconutType as CoconutType;
    if (paymentStatusFilter.length > 0)
      (f as Record<string, unknown>).paymentStatus = paymentStatusFilter;
    return f;
  }, [
    startDate,
    endDate,
    customerId,
    vehicleNumber,
    coconutType,
    paymentStatusFilter,
  ]);

  const {
    data: huskReport,
    isLoading: huskLoading,
    refetch: refetchHusk,
  } = useGetHuskBatchReport(huskFilter, runQuery && reportMode === "husk");

  const {
    data: coconutReport,
    isLoading: coconutLoading,
    refetch: refetchCoconut,
  } = useGetCoconutBatchReport(
    coconutFilter,
    runQuery && reportMode === "coconut",
  );

  const isLoading = reportMode === "husk" ? huskLoading : coconutLoading;
  const report = reportMode === "husk" ? huskReport : coconutReport;

  const handleGenerate = () => {
    setRunQuery(true);
    if (runQuery) {
      if (reportMode === "husk") refetchHusk();
      else refetchCoconut();
    }
  };

  const switchMode = (mode: ReportMode) => {
    setReportMode(mode);
    setRunQuery(false);
    setItemType("");
    setCoconutType("");
    setShowMonthlySummary(false);
  };

  const huskChartData = useMemo(() => {
    if (!huskReport) return [];
    const counts: Record<string, number> = {};
    for (const entry of huskReport.entries) {
      for (const item of entry.items) {
        counts[item.itemType] =
          (counts[item.itemType] ?? 0) + Number(item.quantity);
      }
    }
    return Object.entries(counts).map(([type, qty]) => ({ type, qty }));
  }, [huskReport]);

  const coconutChartData = useMemo(() => {
    if (!coconutReport) return [];
    const counts: Record<string, number> = {};
    for (const entry of coconutReport.entries) {
      for (const item of entry.items) {
        const key =
          item.coconutType === CoconutType.others && item.specifyType
            ? item.specifyType
            : item.coconutType;
        counts[key] = (counts[key] ?? 0) + Number(item.quantity);
      }
    }
    return Object.entries(counts).map(([type, qty]) => ({ type, qty }));
  }, [coconutReport]);

  const chartData = reportMode === "husk" ? huskChartData : coconutChartData;
  const chartColors =
    reportMode === "husk" ? CHART_COLORS : COCONUT_CHART_COLORS;
  const themeColor = reportMode === "husk" ? "#154A27" : "#8B5E3C";

  // Payment counts from report (backend adds these when payment feature is available)
  const reportWithPayment = report as
    | (typeof report & {
        paidCount?: bigint;
        pendingCount?: bigint;
        totalPaymentAmount?: bigint;
      })
    | undefined;

  // Monthly summary computation
  const monthlySummary = useMemo(() => {
    if (!report) return [];
    const map: Record<string, { entries: number; totalQty: number }> = {};
    for (const entry of report.entries) {
      const ym = entry.createdAt
        ? nsToYearMonth(entry.createdAt as bigint)
        : "Unknown";
      if (!map[ym]) map[ym] = { entries: 0, totalQty: 0 };
      map[ym].entries += 1;
      const qty = entry.items.reduce((s, it) => s + Number(it.quantity), 0);
      map[ym].totalQty += qty;
    }
    return Object.entries(map)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([ym, data]) => ({ ym, ...data }));
  }, [report]);

  // Print report
  const printReport = () => {
    if (!report) return;
    const customerName =
      customers?.find((c) => c.id.toString() === customerId)?.name ?? "All";
    const dateRange =
      startDate || endDate
        ? `${startDate || ""} – ${endDate || ""}`
        : "All dates";
    const entries = report.entries;

    let tableRows = "";
    for (const entry of entries) {
      const date = entry.createdAt ? nsToDate(entry.createdAt as bigint) : "";
      const itemsStr = (entry as any).items
        .map((it: any) => {
          const label =
            reportMode === "husk"
              ? (ITEM_TYPE_LABELS[it.itemType as ItemType] ?? it.itemType)
              : it.coconutType === CoconutType.others && it.specifyType
                ? it.specifyType
                : (COCONUT_TYPE_LABELS[it.coconutType as CoconutType] ??
                  it.coconutType);
          return `${label}: ${it.quantity}`;
        })
        .join(", ");
      const total = (entry as any).items.reduce(
        (s: number, it: any) => s + Number(it.quantity),
        0,
      );

      let paymentCols = "";
      if (isAdmin) {
        const ps = (entry as any).paymentStatus;
        const statusStr =
          ps && typeof ps === "object"
            ? "paid" in ps
              ? "Paid"
              : "Pending"
            : "";
        const amtStr =
          (entry as any).paymentAmount !== undefined
            ? `₹${(entry as any).paymentAmount}`
            : "";
        paymentCols = `<td>${statusStr}</td><td>${amtStr}</td>`;
      }

      tableRows += `<tr><td>${date}</td><td>${entry.customerName}</td><td>${entry.vehicleNumber}</td><td>${itemsStr}</td><td>${total}</td>${paymentCols}</tr>`;
    }

    const paymentHeaders = isAdmin ? "<th>Payment</th><th>Amount</th>" : "";

    const html = `<!DOCTYPE html><html><head><title>ACW HuskTrack Report</title>
      <style>body{font-family:sans-serif;padding:20px}h1{color:#154A27}table{width:100%;border-collapse:collapse;margin-top:12px}th,td{border:1px solid #ccc;padding:6px 8px;font-size:12px;text-align:left}th{background:#154A27;color:white}tr:nth-child(even){background:#f9f9f9}.meta{font-size:13px;color:#555;margin:4px 0}</style></head>
      <body>
        <h1>ACW HuskTrack — ${reportMode === "husk" ? "Husk" : "Coconut"} Report</h1>
        <p class="meta">Generated: ${new Date().toLocaleString()}</p>
        <p class="meta">Date Range: ${dateRange}</p>
        <p class="meta">Customer: ${customerName}</p>
        <p class="meta">Total Quantity: ${report.totalQuantity.toString()} Nos (${entries.length} entries)</p>
        <table><thead><tr><th>Date</th><th>Customer</th><th>Vehicle</th><th>Items</th><th>Total</th>${paymentHeaders}</tr></thead>
        <tbody>${tableRows}</tbody></table>
      </body></html>`;

    const printWin = window.open("", "_blank");
    if (!printWin) return;
    printWin.document.write(html);
    printWin.document.close();
    printWin.print();
  };

  // Share report
  const shareReport = async () => {
    if (!report) return;
    const customerName =
      customers?.find((c) => c.id.toString() === customerId)?.name ?? "All";
    const dateRange =
      startDate || endDate
        ? `${startDate || ""} - ${endDate || ""}`
        : "All dates";
    const lines: string[] = [
      `ACW HuskTrack — ${reportMode === "husk" ? "Husk" : "Coconut"} Report`,
      `Generated: ${new Date().toLocaleString()}`,
      `Date Range: ${dateRange}`,
      `Customer: ${customerName}`,
      `Total Quantity: ${report.totalQuantity.toString()} Nos`,
      `Entries: ${report.entries.length}`,
      "",
    ];
    for (const entry of report.entries) {
      const date = entry.createdAt ? nsToDate(entry.createdAt as bigint) : "";
      const itemsStr = (entry as any).items
        .map((it: any) => {
          const label =
            reportMode === "husk"
              ? (ITEM_TYPE_LABELS[it.itemType as ItemType] ?? it.itemType)
              : it.coconutType === CoconutType.others && it.specifyType
                ? it.specifyType
                : (COCONUT_TYPE_LABELS[it.coconutType as CoconutType] ??
                  it.coconutType);
          return `${label}:${it.quantity}`;
        })
        .join(", ");
      const total = (entry as any).items.reduce(
        (s: number, it: any) => s + Number(it.quantity),
        0,
      );
      lines.push(
        `${date} | ${entry.customerName} | ${entry.vehicleNumber} | ${itemsStr} | Total:${total}`,
      );
    }
    const summaryText = lines.join("\n");

    if (navigator.share) {
      try {
        await navigator.share({ title: "ACW Report", text: summaryText });
      } catch {
        // User cancelled or share failed — fallback to clipboard
        await navigator.clipboard.writeText(summaryText);
        const { toast } = await import("sonner");
        toast.success("Report copied to clipboard");
      }
    } else {
      await navigator.clipboard.writeText(summaryText);
      const { toast } = await import("sonner");
      toast.success("Report copied to clipboard");
    }
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <h2 className="text-lg font-semibold" style={{ color: "#154A27" }}>
        {t("reports")}
      </h2>

      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
        <button
          type="button"
          data-ocid="reports.husk_tab"
          onClick={() => switchMode("husk")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
            reportMode === "husk"
              ? "bg-white shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
          style={reportMode === "husk" ? { color: "#154A27" } : {}}
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
          data-ocid="reports.coconut_tab"
          onClick={() => switchMode("coconut")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
            reportMode === "coconut"
              ? "bg-white shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
          style={reportMode === "coconut" ? { color: "#8B5E3C" } : {}}
        >
          🥥 {t("coconut")}
        </button>
      </div>

      <Card className="shadow-card border-0">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Start Date</Label>
              <Input
                data-ocid="reports.input"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border-input text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border-input text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">{t("customer")}</Label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger
                data-ocid="reports.select"
                className="border-input"
              >
                <SelectValue placeholder={`All ${t("customers")}`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All</SelectItem>
                {(customers ?? []).map((c) => (
                  <SelectItem key={c.id.toString()} value={c.id.toString()}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">
                {t("vehicleNumber")}
              </Label>
              <Input
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                placeholder="e.g. TN01AB1234"
                className="border-input"
              />
            </div>
            <div className="space-y-1">
              {reportMode === "husk" ? (
                <>
                  <Label className="text-xs font-semibold">
                    {t("itemType")}
                  </Label>
                  <Select value={itemType} onValueChange={setItemType}>
                    <SelectTrigger className="border-input">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All</SelectItem>
                      {ITEM_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {ITEM_TYPE_LABELS[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              ) : (
                <>
                  <Label className="text-xs font-semibold">
                    {t("coconutType")}
                  </Label>
                  <Select value={coconutType} onValueChange={setCoconutType}>
                    <SelectTrigger className="border-input">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All</SelectItem>
                      {COCONUT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {COCONUT_TYPE_LABELS[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>
          </div>

          {/* Admin-only Payment Filter */}
          {isAdmin && (
            <div className="space-y-1">
              <Label className="text-xs font-semibold">💳 Payment Status</Label>
              <div className="flex gap-2">
                {[
                  "" as PaymentFilterMode,
                  "paid" as PaymentFilterMode,
                  "pending" as PaymentFilterMode,
                ].map((mode) => (
                  <button
                    key={mode || "all"}
                    type="button"
                    data-ocid="reports.toggle"
                    onClick={() => setPaymentFilter(mode)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      paymentFilter === mode
                        ? mode === "paid"
                          ? "bg-green-600 text-white border-green-600"
                          : mode === "pending"
                            ? "bg-amber-500 text-white border-amber-500"
                            : "bg-gray-700 text-white border-gray-700"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    {mode === ""
                      ? "All"
                      : mode === "paid"
                        ? "✅ Paid"
                        : "⏳ Pending"}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button
            data-ocid="reports.primary_button"
            className="w-full text-white font-semibold"
            style={{ backgroundColor: themeColor }}
            onClick={handleGenerate}
          >
            <BarChart2 size={14} className="mr-2" />
            {t("generate")}
          </Button>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="space-y-3" data-ocid="reports.loading_state">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      )}

      {report && !isLoading && (
        <>
          <Card
            className="shadow-card border-0"
            style={{ background: themeColor }}
          >
            <CardContent className="p-4 text-center">
              <p className="text-sm text-white/70">{t("totalQuantity")}</p>
              <p className="text-4xl font-bold text-white mt-1">
                {report.totalQuantity.toString()}
                <span className="text-lg ml-1 font-normal">Nos</span>
              </p>
              <p className="text-xs text-white/50 mt-1">
                {report.entries.length} entries
              </p>
            </CardContent>
          </Card>

          {/* Admin-only Payment Summary */}
          {isAdmin && reportWithPayment?.paidCount !== undefined && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Card className="shadow-card border-0 border-l-4 border-l-green-500">
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground">✅ Paid</p>
                    <p className="text-2xl font-bold text-green-700 mt-0.5">
                      {reportWithPayment.paidCount.toString()}
                    </p>
                    <p className="text-[10px] text-muted-foreground">entries</p>
                  </CardContent>
                </Card>
                <Card className="shadow-card border-0 border-l-4 border-l-amber-400">
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground">⏳ Pending</p>
                    <p className="text-2xl font-bold text-amber-600 mt-0.5">
                      {reportWithPayment.pendingCount?.toString() ?? "0"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">entries</p>
                  </CardContent>
                </Card>
              </div>
              {reportWithPayment?.totalPaymentAmount !== undefined && (
                <Card className="shadow-card border-0 border-l-4 border-l-indigo-500">
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground">
                      💰 Total Collected
                    </p>
                    <p className="text-2xl font-bold text-indigo-600 mt-0.5">
                      ₹ {reportWithPayment.totalPaymentAmount.toString()}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      payment amount
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {report.entries.length > 0 && (
            <div className="space-y-2">
              {/* {t("exportCSV")} */}
              <Button
                variant="outline"
                className="w-full font-semibold"
                style={{ borderColor: themeColor, color: themeColor }}
                onClick={() =>
                  exportToCSV(reportMode, huskReport, coconutReport, isAdmin)
                }
              >
                <Download size={14} className="mr-2" />
                {t("exportCSV")}
              </Button>

              {/* Print & Share */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  data-ocid="reports.secondary_button"
                  variant="outline"
                  className="font-semibold text-sm"
                  style={{ borderColor: themeColor, color: themeColor }}
                  onClick={printReport}
                >
                  🖨️ {t("printReport")}
                </Button>
                <Button
                  data-ocid="reports.secondary_button"
                  variant="outline"
                  className="font-semibold text-sm"
                  style={{ borderColor: themeColor, color: themeColor }}
                  onClick={shareReport}
                >
                  📤 {t("shareReport")}
                </Button>
              </div>

              {/* Monthly Summary Toggle */}
              <Button
                data-ocid="reports.toggle"
                variant="outline"
                className="w-full font-semibold"
                style={{ borderColor: themeColor, color: themeColor }}
                onClick={() => setShowMonthlySummary((v) => !v)}
              >
                📅 {showMonthlySummary ? t("hideMonthly") : t("monthlyView")}
              </Button>
            </div>
          )}

          {/* Monthly Summary */}
          {showMonthlySummary && monthlySummary.length > 0 && (
            <Card className="shadow-card border-0">
              <CardHeader className="p-3 pb-0">
                <CardTitle
                  className="text-sm font-semibold"
                  style={{ color: themeColor }}
                >
                  📅 {t("monthlySummary")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table data-ocid="reports.table">
                  <TableHeader>
                    <TableRow
                      style={{
                        backgroundColor:
                          reportMode === "husk" ? "#BFD8A8" : "#E8D5C4",
                      }}
                    >
                      <TableHead
                        style={{ color: themeColor }}
                        className="font-semibold"
                      >
                        Month
                      </TableHead>
                      <TableHead
                        style={{ color: themeColor }}
                        className="font-semibold text-center"
                      >
                        Entries
                      </TableHead>
                      <TableHead
                        style={{ color: themeColor }}
                        className="font-semibold text-right"
                      >
                        Total Qty
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlySummary.map((row, i) => (
                      <TableRow key={row.ym} data-ocid={`reports.row.${i + 1}`}>
                        <TableCell className="text-sm font-medium">
                          {formatYearMonth(row.ym)}
                        </TableCell>
                        <TableCell className="text-sm text-center">
                          {row.entries}
                        </TableCell>
                        <TableCell className="text-sm text-right font-semibold">
                          {row.totalQty} Nos
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {chartData.length > 0 && (
            <Card className="shadow-card border-0">
              <CardContent className="p-3">
                <p className="text-xs font-semibold text-muted-foreground mb-3">
                  {reportMode === "husk"
                    ? "Quantity by Item Type"
                    : "Quantity by Coconut Type"}
                </p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={chartData}>
                    <XAxis
                      dataKey="type"
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ fontSize: 11, borderRadius: 8 }}
                      formatter={(v) => [`${v} Nos`, t("quantity")]}
                    />
                    <Bar dataKey="qty" radius={[4, 4, 0, 0]}>
                      {chartData.map((item) => (
                        <Cell
                          key={item.type}
                          fill={chartColors[item.type] ?? themeColor}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {report.entries.length > 0 && (
            <Card className="shadow-card border-0">
              <CardContent className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs" data-ocid="reports.table">
                    <thead>
                      <tr
                        className="border-b border-border"
                        style={{
                          backgroundColor:
                            reportMode === "husk" ? "#BFD8A8" : "#E8D5C4",
                        }}
                      >
                        <th
                          className="text-left p-2 font-semibold"
                          style={{ color: themeColor }}
                        >
                          Customer
                        </th>
                        <th
                          className="text-left p-2 font-semibold"
                          style={{ color: themeColor }}
                        >
                          Vehicle
                        </th>
                        <th
                          className="text-left p-2 font-semibold"
                          style={{ color: themeColor }}
                        >
                          Items
                        </th>
                        <th
                          className="text-right p-2 font-semibold"
                          style={{ color: themeColor }}
                        >
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportMode === "husk"
                        ? (huskReport?.entries ?? []).map((entry, i) => {
                            const total = entry.items.reduce(
                              (s, it) => s + Number(it.quantity),
                              0,
                            );
                            return (
                              <tr
                                key={entry.id.toString()}
                                className="border-b border-border last:border-0"
                                data-ocid={`reports.row.${i + 1}`}
                              >
                                <td className="p-2 truncate max-w-[80px]">
                                  {entry.customerName}
                                </td>
                                <td className="p-2">{entry.vehicleNumber}</td>
                                <td className="p-2">
                                  <div className="flex flex-col gap-0.5">
                                    {entry.items.map((item, itemIdx) => (
                                      <span
                                        key={`${entry.id.toString()}-${item.itemType}-${itemIdx}`}
                                        className="text-[10px]"
                                      >
                                        {ITEM_TYPE_LABELS[item.itemType]} –{" "}
                                        {item.quantity.toString()}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td className="p-2 text-right font-semibold">
                                  {total}
                                </td>
                              </tr>
                            );
                          })
                        : (coconutReport?.entries ?? []).map((entry, i) => {
                            const total = entry.items.reduce(
                              (s, it) => s + Number(it.quantity),
                              0,
                            );
                            return (
                              <tr
                                key={entry.id.toString()}
                                className="border-b border-border last:border-0"
                                data-ocid={`reports.row.${i + 1}`}
                              >
                                <td className="p-2 truncate max-w-[80px]">
                                  {entry.customerName}
                                </td>
                                <td className="p-2">{entry.vehicleNumber}</td>
                                <td className="p-2">
                                  <div className="flex flex-col gap-0.5">
                                    {entry.items.map((item, itemIdx) => (
                                      <span
                                        key={`${entry.id.toString()}-${item.coconutType}-${itemIdx}`}
                                        className="text-[10px]"
                                      >
                                        {item.coconutType ===
                                          CoconutType.others && item.specifyType
                                          ? item.specifyType
                                          : COCONUT_TYPE_LABELS[
                                              item.coconutType
                                            ]}{" "}
                                        – {item.quantity.toString()}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td className="p-2 text-right font-semibold">
                                  {total}
                                </td>
                              </tr>
                            );
                          })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {runQuery && !isLoading && report?.entries.length === 0 && (
        <Card className="shadow-card border-0">
          <CardContent
            className="p-6 text-center text-sm text-muted-foreground"
            data-ocid="reports.empty_state"
          >
            {t("noData")}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
