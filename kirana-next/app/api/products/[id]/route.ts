import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const row = await queryOne(
    `SELECT id, name, category, unit, buying_price as "buyingPrice",
     selling_price as "sellingPrice", current_stock as "currentStock",
     min_stock_level as "minStockLevel", barcode, is_active as "isActive",
     created_at as "createdAt" FROM products WHERE id = $1`,
    [id]
  );
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const { name, category, unit, buyingPrice, sellingPrice, currentStock, minStockLevel, barcode, isActive } = body;

  const row = await queryOne(
    `UPDATE products SET name=$1, category=$2, unit=$3, buying_price=$4, selling_price=$5,
     current_stock=$6, min_stock_level=$7, barcode=$8, is_active=$9
     WHERE id=$10 RETURNING id, name, category, unit, buying_price as "buyingPrice",
     selling_price as "sellingPrice", current_stock as "currentStock",
     min_stock_level as "minStockLevel", barcode, is_active as "isActive", created_at as "createdAt"`,
    [name, category, unit, buyingPrice, sellingPrice, currentStock, minStockLevel,
     barcode || null, isActive ?? true, id]
  );
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  await query(`DELETE FROM products WHERE id = $1`, [id]);
  return NextResponse.json({ success: true });
}
