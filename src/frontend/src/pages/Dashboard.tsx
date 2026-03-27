import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ItemType } from "../backend";
import { useGetAllCustomers, useGetAllEntries } from "../hooks/useQueries";
import { useI18n } from "../i18n";

function nsToDate(ns: bigint): Date {
  return new Date(Number(ns / 1_000_000n));
}

const ITEM_TYPE_COLORS: Record<string, string> = {
  [ItemType.husk]: "#154A27",
  [ItemType.dry]: "#2d7a4f",
  [ItemType.wet]: "#4e9e6e",
  [ItemType.both]: "#7dc4a0",
  [ItemType.motta]: "#BFD8A8",
  [ItemType.others]: "#a8c590",
};

export default function Dashboard({ userName }: { userName: string }) {
  const { t } = useI18n();
  const { data: entries, isLoading: entriesLoading } = useGetAllEntries();
  const { data: customers } = useGetAllCustomers();

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
        .sort((a, b) => Number(b.createdAt - a.createdAt))
        .slice(0, 10),
    [entries],
  );

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
                className="shadow-card border-0"
                data-ocid={`entries.item.${idx + 1}`}
              >
                <CardContent className="p-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {entry.customerName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {entry.vehicleNumber} \u00b7{" "}
                      {nsToDate(entry.createdAt).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge
                      className="text-[10px] font-semibold text-white"
                      style={{
                        backgroundColor:
                          ITEM_TYPE_COLORS[entry.itemType] ?? "#154A27",
                      }}
                    >
                      {entry.itemType}
                    </Badge>
                    <span
                      className="text-xs font-bold"
                      style={{ color: "#154A27" }}
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
