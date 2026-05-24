import { NextRequest, NextResponse } from "next/server";
import { query, initDB } from "@/lib/db";

let initialized = false;
async function ensureInit() {
  if (!initialized) {
    await initDB();
    initialized = true;
  }
}

export async function GET(req: NextRequest) {
  await ensureInit();
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const category = searchParams.get("category") ?? "";
  const lowStock = searchParams.get("lowStock") === "true";

  let sql = `SELECT id, name, category, unit, buying_price as "buyingPrice",
    selling_price as "sellingPrice", current_stock as "currentStock",
    min_stock_level as "minStockLevel", barcode, is_active as "isActive",
    created_at as "createdAt" FROM products WHERE 1=1`;
  const params: unknown[] = [];
  let i = 1;

  if (search) {
    sql += ` AND (name ILIKE $${i} OR category ILIKE $${i})`;
    params.push(`%${search}%`);
    i++;
  }
  if (category) {
    sql += ` AND category = $${i}`;
    params.push(category);
    i++;
  }
  if (lowStock) {
    sql += ` AND current_stock <= min_stock_level`;
  }
  sql += ` ORDER BY name ASC`;

  const rows = await query(sql, params);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  await ensureInit();
  const body = await req.json();
  const { name, category, unit, buyingPrice, sellingPrice, currentStock, minStockLevel, barcode } = body;

  const rows = await query(
    `INSERT INTO products (name, category, unit, buying_price, selling_price, current_stock, min_stock_level, barcode)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id, name, category, unit,
     buying_price as "buyingPrice", selling_price as "sellingPrice",
     current_stock as "currentStock", min_stock_level as "minStockLevel",
     barcode, is_active as "isActive", created_at as "createdAt"`,
    [name, category || "General", unit || "piece", buyingPrice || 0, sellingPrice || 0,
     currentStock || 0, minStockLevel || 5, barcode || null]
  );
  return NextResponse.json(rows[0], { status: 201 });
}
