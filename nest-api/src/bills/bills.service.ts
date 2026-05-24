import { Injectable } from '@nestjs/common';
import { DbService } from '../db/db.service';

@Injectable()
export class BillsService {
  constructor(private readonly db: DbService) {}

  async findAll(limit = 50, offset = 0) {
    const bills = await this.db.query(
      `SELECT b.id, b.bill_number as "billNumber", b.customer_id as "customerId",
       b.customer_name as "customerName", b.subtotal as "totalAmount",
       b.discount as "discountAmount", b.total as "finalAmount",
       b.payment_method as "paymentMode", b.notes, b.created_at as "createdAt"
       FROM bills b ORDER BY b.created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset],
    );

    return Promise.all(
      bills.map(async (bill: any) => {
        const items = await this.db.query(
          `SELECT product_id as "productId", product_name as "productName",
           quantity, selling_price as "unitPrice", total as "totalPrice"
           FROM bill_items WHERE bill_id = $1`,
          [bill.id],
        );
        return {
          ...bill,
          totalAmount: parseFloat(bill.totalAmount),
          discountAmount: parseFloat(bill.discountAmount),
          finalAmount: parseFloat(bill.finalAmount),
          items: items.map((i: any) => ({
            ...i,
            quantity: parseFloat(i.quantity),
            unitPrice: parseFloat(i.unitPrice),
            totalPrice: parseFloat(i.totalPrice),
          })),
        };
      }),
    );
  }

  async create(data: {
    customerId?: number;
    items: { productId?: number; productName?: string; quantity: number; unitPrice: number; totalPrice: number }[];
    totalAmount: number;
    discountAmount: number;
    finalAmount: number;
    paymentMode: string;
  }) {
    const pool = this.db.getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      let customerName: string | null = null;
      if (data.customerId) {
        const cust = await client.query('SELECT name FROM customers WHERE id=$1', [data.customerId]);
        customerName = cust.rows[0]?.name ?? null;
      }

      const billNumber = `BILL-${Date.now()}`;
      const billRes = await client.query(
        `INSERT INTO bills (bill_number, customer_id, customer_name, subtotal, discount, gst_amount, total, payment_method)
         VALUES ($1,$2,$3,$4,$5,0,$6,$7)
         RETURNING id, created_at as "createdAt"`,
        [billNumber, data.customerId || null, customerName,
         data.totalAmount, data.discountAmount || 0, data.finalAmount, data.paymentMode || 'cash'],
      );
      const bill = billRes.rows[0];

      for (const item of data.items || []) {
        if (item.productId) {
          const prod = await client.query(
            'SELECT buying_price, name, unit FROM products WHERE id=$1',
            [item.productId],
          );
          const buyingPrice = parseFloat(prod.rows[0]?.buying_price ?? '0');
          await client.query(
            'UPDATE products SET current_stock = GREATEST(0, current_stock - $1) WHERE id = $2',
            [item.quantity, item.productId],
          );
          await client.query(
            `INSERT INTO bill_items (bill_id, product_id, product_name, quantity, unit, buying_price, selling_price, total)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
            [bill.id, item.productId, prod.rows[0]?.name ?? 'Product', item.quantity,
             prod.rows[0]?.unit ?? 'piece', buyingPrice, item.unitPrice, item.totalPrice],
          );
        } else {
          await client.query(
            `INSERT INTO bill_items (bill_id, product_id, product_name, quantity, unit, buying_price, selling_price, total)
             VALUES ($1,NULL,$2,$3,'piece',0,$4,$5)`,
            [bill.id, item.productName || 'Item', item.quantity, item.unitPrice, item.totalPrice],
          );
        }
      }

      if (data.paymentMode === 'khata' && data.customerId) {
        await client.query(
          `INSERT INTO khata_transactions (customer_id, type, amount, description)
           VALUES ($1,'credit',$2,$3)`,
          [data.customerId, data.finalAmount, `Bill #${bill.id}`],
        );
      }

      await client.query('COMMIT');

      return {
        id: bill.id,
        billNumber,
        customerId: data.customerId || null,
        customerName,
        totalAmount: data.totalAmount,
        discountAmount: data.discountAmount || 0,
        finalAmount: data.finalAmount,
        paymentMode: data.paymentMode,
        createdAt: bill.createdAt,
        items: data.items,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}
