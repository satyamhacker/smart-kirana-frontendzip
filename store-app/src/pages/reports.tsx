import { useState } from "react";
import {
  useGetSalesReport,
  useGetProfitReport,
  useGetPendingKhataReport,
  useGetLowStockReport,
  getGetSalesReportQueryKey,
  getGetProfitReportQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { IndianRupee, TrendingUp, BookOpen, AlertTriangle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Period = "7d" | "30d" | "90d";

function getRange(period: Period) {
  const to = new Date().toISOString().split("T")[0];
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  return { from, to };
}

export default function Reports() {
  const [period, setPeriod] = useState<Period>("30d");
  const { from, to } = getRange(period);

  const { data: salesReport, isLoading: loadSales } = useGetSalesReport(
    { period: "daily", from, to },
    { query: { queryKey: getGetSalesReportQueryKey({ period: "daily", from, to }) } }
  );
  const { data: profitReport, isLoading: loadProfit } = useGetProfitReport(
    { from, to },
    { query: { queryKey: getGetProfitReportQueryKey({ from, to }) } }
  );
  const { data: khataReport, isLoading: loadKhata } = useGetPendingKhataReport();
  const { data: stockReport, isLoading: loadStock } = useGetLowStockReport();

  const periodButtons: { label: string; value: Period }[] = [
    { label: "7 दिन", value: "7d" },
    { label: "30 दिन", value: "30d" },
    { label: "90 दिन", value: "90d" },
  ];

  return (
    <div className="space-y-6" data-testid="page-reports">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Reports
            <span className="ml-2 text-base font-normal text-muted-foreground">
              (रिपोर्ट)
            </span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Apni dukaan ka performance dekhein
          </p>
        </div>
        {/* Period Selector */}
        <div className="flex gap-1 rounded-lg border bg-muted/40 p-1">
          {periodButtons.map((b) => (
            <button
              key={b.value}
              onClick={() => setPeriod(b.value)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                period === b.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              data-testid={`button-period-${b.value}`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "कुल बिक्री",
            sublabel: "Total Revenue",
            value: `₹${(profitReport?.totalRevenue ?? 0).toFixed(0)}`,
            icon: IndianRupee,
            colorClass: "text-primary",
            bgClass: "bg-teal-50",
            borderClass: "border-teal-200",
          },
          {
            label: "कुल मुनाफा",
            sublabel: "Total Profit",
            value: `₹${(profitReport?.totalProfit ?? 0).toFixed(0)}`,
            note: `${(profitReport?.profitMargin ?? 0).toFixed(1)}% margin`,
            icon: TrendingUp,
            colorClass: "text-positive",
            bgClass: "bg-green-50",
            borderClass: "border-green-200",
          },
          {
            label: "उधार बाकी",
            sublabel: "Pending Khata",
            value: `₹${(khataReport?.totalPending ?? 0).toFixed(0)}`,
            note: `${khataReport?.customerCount ?? 0} customers`,
            icon: BookOpen,
            colorClass: "text-warning",
            bgClass: "bg-amber-50",
            borderClass: "border-amber-200",
          },
          {
            label: "कम स्टॉक",
            sublabel: "Low Stock Items",
            value: `${stockReport?.length ?? 0}`,
            note: `${stockReport?.filter((p) => p.currentStock === 0).length ?? 0} out of stock`,
            icon: AlertTriangle,
            colorClass: "text-destructive",
            bgClass: "bg-red-50",
            borderClass: "border-red-200",
          },
        ].map((card) => (
          <Card key={card.label} className={`border ${card.borderClass} ${card.bgClass}`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {card.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{card.sublabel}</p>
                </div>
                <card.icon className={`h-4 w-4 ${card.colorClass}`} />
              </div>
              <div className={`mt-3 text-2xl font-extrabold ${card.colorClass}`}>
                {loadSales || loadProfit || loadKhata || loadStock ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  card.value
                )}
              </div>
              {card.note && (
                <p className="mt-1 text-xs text-muted-foreground">{card.note}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Sales Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              बिक्री Trend
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                (Daily Sales)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[220px]">
            {loadSales ? (
              <div className="h-full flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : salesReport?.data && salesReport.data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesReport.data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                    tickFormatter={(v) => v.slice(5)}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                    tickFormatter={(v) => `₹${v}`}
                  />
                  <Tooltip
                    cursor={{ fill: "hsl(var(--muted))" }}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                      fontSize: 12,
                    }}
                    formatter={(v: number) => [`₹${v.toFixed(0)}`, "Sales"]}
                  />
                  <Bar
                    dataKey="sales"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Is period mein koi sales nahi
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profit Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              मुनाफा Trend
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                (Profit over Time)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[220px]">
            {loadProfit ? (
              <div className="h-full flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : profitReport?.data && profitReport.data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={profitReport.data}
                  margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="hsl(142 60% 32%)"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(142 60% 32%)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                    tickFormatter={(v) => v.slice(5)}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                    tickFormatter={(v) => `₹${v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                      fontSize: 12,
                    }}
                    formatter={(v: number) => [`₹${v.toFixed(0)}`, "Profit"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stroke="hsl(142 60% 32%)"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#profitGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Is period mein koi profit data nahi
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tables */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Pending Khata */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-warning" />
              Pending Udhaar
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadKhata ? (
              <div className="p-5 space-y-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
            ) : khataReport?.customers?.length ? (
              <div className="divide-y">
                {khataReport.customers.slice(0, 6).map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between px-5 py-3 hover:bg-muted/20"
                    data-testid={`row-khata-${c.id}`}
                  >
                    <div>
                      <p className="font-semibold text-sm">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.phone}</p>
                    </div>
                    <span className="font-bold text-warning text-sm">
                      ₹{c.totalDue.toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <BookOpen className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm">Koi udhaar nahi — sab clear hai!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadStock ? (
              <div className="p-5 space-y-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
            ) : stockReport?.length ? (
              <div className="divide-y">
                {stockReport.slice(0, 6).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between px-5 py-3 hover:bg-muted/20"
                    data-testid={`row-lowstock-${p.id}`}
                  >
                    <div>
                      <p className="font-semibold text-sm">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.category}</p>
                    </div>
                    <div className="text-right">
                      <Badge
                        className={cn(
                          "text-[10px] font-medium",
                          p.currentStock === 0
                            ? "bg-red-100 text-red-700 border-red-200"
                            : "bg-amber-100 text-amber-700 border-amber-200"
                        )}
                      >
                        {p.currentStock === 0
                          ? "Out of Stock"
                          : `${p.currentStock} left`}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <AlertTriangle className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm">Sab stock sahi level par hai</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
