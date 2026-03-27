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
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart2 } from "lucide-react";
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

type ReportMode = "husk" | "coconut";

export default function Reports() {
  const { t } = useI18n();
  const { data: customers } = useGetAllCustomers();

  const [reportMode, setReportMode] = useState<ReportMode>("husk");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [runQuery, setRunQuery] = useState(false);
  const [itemType, setItemType] = useState("");
  const [coconutType, setCoconutType] = useState("");

  const huskFilter: ReportFilter = useMemo(() => {
    const f: ReportFilter = {};
    if (startDate) f.startDate = dateToNs(startDate);
    if (endDate) f.endDate = dateToNs(`${endDate}T23:59:59`);
    if (customerId) f.customerId = BigInt(customerId);
    if (vehicleNumber) f.vehicleNumber = vehicleNumber;
    if (itemType) f.itemType = itemType as ItemType;
    return f;
  }, [startDate, endDate, customerId, vehicleNumber, itemType]);

  const coconutFilter: CoconutBatchReportFilter = useMemo(() => {
    const f: CoconutBatchReportFilter = {};
    if (startDate) f.startDate = dateToNs(startDate);
    if (endDate) f.endDate = dateToNs(`${endDate}T23:59:59`);
    if (customerId) f.customerId = BigInt(customerId);
    if (vehicleNumber) f.vehicleNumber = vehicleNumber;
    if (coconutType) f.coconutType = coconutType as CoconutType;
    return f;
  }, [startDate, endDate, customerId, vehicleNumber, coconutType]);

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
          🌿 {t("husk")}
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
