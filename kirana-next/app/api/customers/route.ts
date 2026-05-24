import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";

  let sql = `SELECT c.id, c.name, c.phone, c.address, c.created_at as "createdAt",
    COALESCE(SUM(CASE WHEN kt.type='credit' THEN kt.amount ELSE -kt.amount END), 0) as "totalDue"
    FROM customers c
    LEFT JOIN khata_transactions kt ON kt.customer_id = c.id
    WHERE 1=1`;
  const params: unknown[] = [];
  let i = 1;

  if (search) {
    sql += ` AND (c.name ILIKE $${i} OR c.phone ILIKE $${i})`;
    params.push(`%${search}%`);
    i++;
  }
  sql += ` GROUP BY c.id ORDER BY c.name ASC`;

  const rows = await query(sql, params);
  return NextResponse.json(rows.map(r => ({ ...r, totalDue: parseFloat(r.totalDue as string) })));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, phone, address } = body;

  const rows = await query(
    `INSERT INTO customers (name, phone, address) VALUES ($1,$2,$3)
     RETURNING id, name, phone, address, created_at as "createdAt"`,
    [name, phone, address || null]
  );
  return NextResponse.json({ ...rows[0], totalDue: 0 }, { status: 201 });
}
