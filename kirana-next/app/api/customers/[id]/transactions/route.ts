import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const { type, amount, description } = body;

  const rows = await query(
    `INSERT INTO khata_transactions (customer_id, type, amount, description)
     VALUES ($1,$2,$3,$4) RETURNING id, type, amount, description, created_at as "createdAt"`,
    [id, type, amount, description]
  );
  return NextResponse.json({ ...rows[0], amount: parseFloat(rows[0].amount as string) }, { status: 201 });
}
