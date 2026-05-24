import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const customer = await queryOne(
    `SELECT c.id, c.name, c.phone, c.address, c.created_at as "createdAt",
     COALESCE(SUM(CASE WHEN kt.type='credit' THEN kt.amount ELSE -kt.amount END), 0) as "totalDue"
     FROM customers c
     LEFT JOIN khata_transactions kt ON kt.customer_id = c.id
     WHERE c.id = $1 GROUP BY c.id`,
    [id]
  );
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const transactions = await query(
    `SELECT id, type, amount, description, created_at as "createdAt"
     FROM khata_transactions WHERE customer_id = $1 ORDER BY created_at ASC`,
    [id]
  );

  return NextResponse.json({
    ...customer,
    totalDue: parseFloat(customer.totalDue as string),
    transactions: transactions.map(t => ({ ...t, amount: parseFloat(t.amount as string) })),
  });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const { name, phone, address } = body;

  const row = await queryOne(
    `UPDATE customers SET name=$1, phone=$2, address=$3 WHERE id=$4
     RETURNING id, name, phone, address, created_at as "createdAt"`,
    [name, phone, address || null, id]
  );
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ...row, totalDue: 0 });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  await query(`DELETE FROM customers WHERE id = $1`, [id]);
  return NextResponse.json({ success: true });
}
