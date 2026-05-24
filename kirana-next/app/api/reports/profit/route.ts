import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  const rows = await query(
    `SELECT DATE(b.created_at) as date,
     COALESCE(SUM(b.total),0) as revenue,
     COALESCE(SUM(b.total - COALESCE(bi_cost.cost,0)),0) as profit
     FROM bills b
     LEFT JOIN (
       SELECT bill_id, SUM(buying_price * quantity) as cost FROM bill_items GROUP BY bill_id
     ) bi_cost ON bi_cost.bill_id = b.id
     WHERE b.created_at >= $1 AND b.created_at <= $2
     GROUP BY DATE(b.created_at)
     ORDER BY date ASC`,
    [from, to]
  );

  const summary = await queryOne<{ revenue: string; cost: string }>(
    `SELECT COALESCE(SUM(b.total),0) as revenue,
     COALESCE(SUM(COALESCE(bi_cost.cost,0)),0) as cost
     FROM bills b
     LEFT JOIN (
       SELECT bill_id, SUM(buying_price * quantity) as cost FROM bill_items GROUP BY bill_id
     ) bi_cost ON bi_cost.bill_id = b.id
     WHERE b.created_at >= $1 AND b.created_at <= $2`,
    [from, to]
  );

  const totalRevenue = parseFloat(summary?.revenue ?? "0");
  const totalCost = parseFloat(summary?.cost ?? "0");
  const totalProfit = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  return NextResponse.json({
    data: rows.map(r => ({
      date: r.date,
      revenue: parseFloat(r.revenue as string),
      profit: parseFloat(r.profit as string),
    })),
    totalRevenue,
    totalCost,
    totalProfit,
    profitMargin,
  });
}
