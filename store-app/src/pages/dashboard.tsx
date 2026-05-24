import { useGetDashboardSummary } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { IndianRupee, TrendingUp, BookOpen, AlertTriangle, PackageOpen, ShoppingBag } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

function StatCard({
  title,
  subtitle,
  value,
  note,
  icon: Icon,
  colorClass,
  bgClass,
  borderClass,
  iconColorClass,
}: {
  title: string;
  subtitle: string;
  value: string;
  note?: string;
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  iconColorClass: string;
}) {
  return (
    <Card className={`border ${borderClass} ${bgClass}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {title}
            </p>
            <p className="text-[10px] text-muted-foreground">{subtitle}</p>
          </div>
          <div className={`rounded-lg p-2 ${bgClass} border ${borderClass}`}>
            <Icon className={`h-4 w-4 ${iconColorClass}`} />
          </div>
        </div>
        <div className={`mt-3 text-3xl font-extrabold ${colorClass}`}>{value}</div>
        {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: summary, isLoading, error } = useGetDashboardSummary();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-7 w-72 mb-1" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="h-48 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        Dashboard load nahi hua. Page refresh karein.
      </div>
    );
  }

  const today = format(new Date(), "EEEE, dd MMM yyyy");

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-400">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          आज का हिसाब
          <span className="ml-2 text-base font-normal text-muted-foreground">
            (Today's Overview)
          </span>
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">{today}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="आज की बिक्री"
          subtitle="Today's Sale"
          value={`₹${(summary.todaySale ?? 0).toFixed(0)}`}
          note={`${summary.todayOrderCount} orders today`}
          icon={IndianRupee}
          colorClass="text-primary"
          bgClass="bg-teal-50"
          borderClass="border-teal-200"
          iconColorClass="text-primary"
        />
        <StatCard
          title="आज का मुनाफा"
          subtitle="Today's Profit"
          value={`₹${(summary.todayProfit ?? 0).toFixed(0)}`}
          icon={TrendingUp}
          colorClass="text-positive"
          bgClass="bg-green-50"
          borderClass="border-green-200"
          iconColorClass="text-positive"
        />
        <StatCard
          title="उधार बाकी"
          subtitle="Pending Khata"
          value={`₹${(summary.pendingKhataAmount ?? 0).toFixed(0)}`}
          note={`${summary.pendingKhataCount} customers`}
          icon={BookOpen}
          colorClass="text-warning"
          bgClass="bg-amber-50"
          borderClass="border-amber-200"
          iconColorClass="text-warning"
        />
        <StatCard
          title="कम स्टॉक"
          subtitle="Low Stock Alert"
          value={`${summary.lowStockCount}`}
          note={`${summary.outOfStockCount} out of stock`}
          icon={AlertTriangle}
          colorClass="text-destructive"
          bgClass="bg-red-50"
          borderClass="border-red-200"
          iconColorClass="text-destructive"
        />
      </div>

      {/* Recent Bills + Low Stock */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingBag className="h-4 w-4 text-primary" />
              हाल की बिक्री
              <span className="text-sm font-normal text-muted-foreground ml-1">
                (Recent Bills)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {summary.recentBills?.length > 0 ? (
              <div className="divide-y">
                {summary.recentBills.slice(0, 6).map((bill) => (
                  <div
                    key={bill.id}
                    className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors"
                    data-testid={`row-bill-${bill.id}`}
                  >
                    <div>
                      <p className="font-semibold text-sm">
                        {bill.customerName || "Walk-in Customer"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Bill #{bill.id} ·{" "}
                        {format(new Date(bill.createdAt), "hh:mm a")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">
                        ₹{bill.finalAmount.toFixed(0)}
                      </p>
                      <Badge
                        variant="outline"
                        className={
                          bill.paymentMode === "khata"
                            ? "text-warning border-amber-300 bg-amber-50 text-[10px]"
                            : bill.paymentMode === "upi"
                              ? "text-primary border-teal-300 bg-teal-50 text-[10px]"
                              : "text-positive border-green-300 bg-green-50 text-[10px]"
                        }
                      >
                        {bill.paymentMode === "khata"
                          ? "Khata"
                          : bill.paymentMode === "upi"
                            ? "UPI"
                            : "Cash"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ShoppingBag className="h-10 w-10 mb-3 opacity-20" />
                <p className="text-sm">Aaj abhi koi bill nahi</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-destructive">
              <PackageOpen className="h-4 w-4" />
              कम स्टॉक वाले सामान
              <span className="text-sm font-normal text-muted-foreground ml-1">
                (Low Stock)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {summary.lowStockProducts?.length > 0 ? (
              <div className="divide-y">
                {summary.lowStockProducts.slice(0, 6).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors"
                    data-testid={`row-lowstock-${product.id}`}
                  >
                    <div>
                      <p className="font-semibold text-sm">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.category}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-bold text-sm ${product.currentStock === 0 ? "text-destructive" : "text-warning"}`}
                      >
                        {product.currentStock === 0
                          ? "Out of Stock"
                          : `${product.currentStock} ${product.unit} left`}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Min: {product.lowStockThreshold}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <PackageOpen className="h-10 w-10 mb-3 opacity-20" />
                <p className="text-sm">Sab stock sahi hai</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
