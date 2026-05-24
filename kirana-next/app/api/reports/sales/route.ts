import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  const period = searchParams.get("period") ?? "daily";

  const rows = await query(
    `SELECT DATE(created_at) as date,
     COALESCE(SUM(total),0) as sales,
     COUNT(*) as bills
     FROM bills
     WHERE created_at >= $1 AND created_at <= $2
     GROUP BY DATE(created_at)
     ORDER BY date ASC`,
    [from, to]
  );

  const summary = await queryOne<{ total: string; count: string }>(
    `SELECT COALESCE(SUM(total),0) as total, COUNT(*) as count FROM bills
     WHERE created_at >= $1 AND created_at <= $2`,
    [from, to]
  );

  return NextResponse.json({
    data: rows.map(r => ({
      date: r.date,
      sales: parseFloat(r.sales as string),
      bills: parseInt(r.bills as string),
    })),
    totalSales: parseFloat(summary?.total ?? "0"),
    totalBills: parseInt(summary?.count ?? "0"),
  });
}
