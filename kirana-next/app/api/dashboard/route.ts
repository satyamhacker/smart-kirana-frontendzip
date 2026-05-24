import { NextResponse } from "next/server";
import { queryOne, query } from "@/lib/db";
import { initDB } from "@/lib/db";

let initialized = false;
async function ensureInit() {
  if (!initialized) {
    await initDB();
    initialized = true;
  }
}

export async function GET() {
  await ensureInit();
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const [todaySales, totalPending, lowStockRows, recentBills] = await Promise.all([
    queryOne<{ revenue: string; profit: string; count: string }>(
      `SELECT COALESCE(SUM(b.total),0) as revenue,
       COALESCE(SUM(b.total - COALESCE(bi_cost.cost,0)),0) as profit,
       COUNT(*) as count
       FROM bills b
       LEFT JOIN (
         SELECT bill_id, SUM(buying_price * quantity) as cost FROM bill_items GROUP BY bill_id
       ) bi_cost ON bi_cost.bill_id = b.id
       WHERE DATE(b.created_at AT TIME ZONE 'Asia/Kolkata') = $1`,
      [todayStr]
    ),
    queryOne<{ total: string; count: string }>(
      `SELECT COALESCE(SUM(CASE WHEN kt.type='credit' THEN kt.amount ELSE -kt.amount END),0) as total,
       COUNT(DISTINCT CASE WHEN sub.due > 0 THEN sub.customer_id END) as count
       FROM (
         SELECT customer_id, SUM(CASE WHEN type='credit' THEN amount ELSE -amount END) as due
         FROM khata_transactions GROUP BY customer_id
       ) sub, (SELECT 1) dummy
       LEFT JOIN khata_transactions kt ON true
       WHERE 1=1
      `
    ),
    query(
      `SELECT id, name, category, unit, current_stock as "currentStock",
       min_stock_level as "lowStockThreshold"
       FROM products WHERE current_stock <= min_stock_level ORDER BY current_stock ASC LIMIT 10`
    ),
    query(
      `SELECT b.id, b.customer_name as "customerName", b.total, b.payment_method as "paymentMode",
       b.created_at as "createdAt"
       FROM bills b ORDER BY b.created_at DESC LIMIT 6`
    ),
  ]);

  // Simpler pending khata query
  const khataRows = await query<{ total: string; count: string }>(
    `SELECT COALESCE(SUM(CASE WHEN type='credit' THEN amount ELSE -amount END),0) as total,
     COUNT(DISTINCT customer_id) as count FROM khata_transactions`
  );
  const khata = khataRows[0];

  const outOfStockCount = lowStockRows.filter(p => (p.currentStock as number) === 0).length;

  return NextResponse.json({
    todaySale: parseFloat(todaySales?.revenue ?? "0"),
    todayProfit: parseFloat(todaySales?.profit ?? "0"),
    todayOrderCount: parseInt(todaySales?.count ?? "0"),
    pendingKhataAmount: parseFloat(khata?.total ?? "0"),
    pendingKhataCount: parseInt(khata?.count ?? "0"),
    lowStockCount: lowStockRows.length,
    outOfStockCount,
    recentBills: recentBills.map(b => ({
      id: b.id,
      customerName: b.customerName ?? null,
      finalAmount: parseFloat(b.total as string),
      paymentMode: b.paymentMode,
      createdAt: b.createdAt,
    })),
    lowStockProducts: lowStockRows.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      unit: p.unit,
      currentStock: p.currentStock,
      lowStockThreshold: p.lowStockThreshold,
    })),
  });
}
