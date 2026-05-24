import { NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";

export async function GET() {
  const customers = await query(
    `SELECT c.id, c.name, c.phone,
     COALESCE(SUM(CASE WHEN kt.type='credit' THEN kt.amount ELSE -kt.amount END),0) as "totalDue"
     FROM customers c
     LEFT JOIN khata_transactions kt ON kt.customer_id = c.id
     GROUP BY c.id
     HAVING COALESCE(SUM(CASE WHEN kt.type='credit' THEN kt.amount ELSE -kt.amount END),0) > 0
     ORDER BY "totalDue" DESC`
  );

  const summary = await queryOne<{ total: string; count: string }>(
    `SELECT COALESCE(SUM(CASE WHEN type='credit' THEN amount ELSE -amount END),0) as total,
     COUNT(DISTINCT customer_id) as count
     FROM khata_transactions`
  );

  return NextResponse.json({
    customers: customers.map(c => ({ ...c, totalDue: parseFloat(c.totalDue as string) })),
    totalPending: parseFloat(summary?.total ?? "0"),
    customerCount: parseInt(summary?.count ?? "0"),
  });
}
