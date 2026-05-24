import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  const rows = await query(
    `SELECT id, name, category, unit, current_stock as "currentStock",
     min_stock_level as "minStockLevel"
     FROM products
     WHERE current_stock <= min_stock_level
     ORDER BY current_stock ASC`
  );
  return NextResponse.json(rows);
}
