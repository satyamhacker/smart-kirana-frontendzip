import { NextRequest, NextResponse } from "next/server";
import { query, pool } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") ?? "50");
  const offset = parseInt(searchParams.get("offset") ?? "0");

  const bills = await query(
    `SELECT b.id, b.bill_number as "billNumber", b.customer_id as "customerId",
     b.customer_name as "customerName", b.subtotal as "totalAmount",
     b.discount as "discountAmount", b.total as "finalAmount",
     b.payment_method as "paymentMode", b.notes, b.created_at as "createdAt"
     FROM bills b ORDER BY b.created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  const billsWithItems = await Promise.all(
    bills.map(async (bill) => {
      const items = await query(
        `SELECT product_id as "productId", product_name as "productName",
         quantity, selling_price as "unitPrice", total as "totalPrice"
         FROM bill_items WHERE bill_id = $1`,
        [bill.id]
      );
      return {
        ...bill,
        totalAmount: parseFloat(bill.totalAmount as string),
        discountAmount: parseFloat(bill.discountAmount as string),
        finalAmount: parseFloat(bill.finalAmount as string),
        items: items.map(i => ({
          ...i,
          quantity: parseFloat(i.quantity as string),
          unitPrice: parseFloat(i.unitPrice as string),
          totalPrice: parseFloat(i.totalPrice as string),
        })),
      };
    })
  );

  return NextResponse.json(billsWithItems);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { customerId, items, totalAmount, discountAmount, finalAmount, paymentMode } = body;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Resolve customer name
    let customerName: string | null = null;
    if (customerId) {
      const cust = await client.query(`SELECT name FROM customers WHERE id=$1`, [customerId]);
      customerName = cust.rows[0]?.name ?? null;
    }

    const billNumber = `BILL-${Date.now()}`;
    const billRes = await client.query(
      `INSERT INTO bills (bill_number, customer_id, customer_name, subtotal, discount, gst_amount, total, payment_method)
       VALUES ($1,$2,$3,$4,$5,0,$6,$7) RETURNING id, created_at as "createdAt"`,
      [billNumber, customerId || null, customerName, totalAmount, discountAmount || 0, finalAmount, paymentMode || "cash"]
    );
    const bill = billRes.rows[0];

    for (const item of items || []) {
      // Get buying price for profit tracking
      let buyingPrice = 0;
      if (item.productId) {
        const prod = await client.query(`SELECT buying_price, name, unit FROM products WHERE id=$1`, [item.productId]);
        buyingPrice = parseFloat(prod.rows[0]?.buying_price ?? "0");
        // Deduct stock
        await client.query(
          `UPDATE products SET current_stock = GREATEST(0, current_stock - $1) WHERE id = $2`,
          [item.quantity, item.productId]
        );
        await client.query(
          `INSERT INTO bill_items (bill_id, product_id, product_name, quantity, unit, buying_price, selling_price, total)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [bill.id, item.productId, prod.rows[0]?.name ?? "Product", item.quantity,
           prod.rows[0]?.unit ?? "piece", buyingPrice, item.unitPrice, item.totalPrice]
        );
      } else {
        await client.query(
          `INSERT INTO bill_items (bill_id, product_id, product_name, quantity, unit, buying_price, selling_price, total)
           VALUES ($1,NULL,$2,$3,'piece',0,$4,$5)`,
          [bill.id, item.productName || "Item", item.quantity, item.unitPrice, item.totalPrice]
        );
      }
    }

    // If khata payment mode, create a credit transaction
    if (paymentMode === "khata" && customerId) {
      await client.query(
        `INSERT INTO khata_transactions (customer_id, type, amount, description)
         VALUES ($1,'credit',$2,'Bill #${bill.id}')`,
        [customerId, finalAmount]
      );
    }

    await client.query("COMMIT");
    return NextResponse.json({
      id: bill.id,
      billNumber,
      customerId: customerId || null,
      customerName,
      totalAmount,
      discountAmount: discountAmount || 0,
      finalAmount,
      paymentMode,
      createdAt: bill.createdAt,
      items,
    }, { status: 201 });
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
