/**
 * Demo seed script — inserts 30 days of bills, bill_items, and khata transactions.
 * Run once: cd nest-api && npx ts-node -r reflect-metadata src/scripts/seed-demo.ts
 */
import 'reflect-metadata';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function rnd(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function dateStr(daysAgo: number, hour: number, min: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
}

async function run() {
  const client = await pool.connect();
  try {
    // ── fetch existing products ──────────────────────────────────────────────
    const { rows: products } = await client.query(
      `SELECT id, name, unit, buying_price, selling_price FROM products WHERE is_active = true ORDER BY id`
    );
    if (!products.length) {
      console.error('No products found — run the app first to trigger initDB()');
      process.exit(1);
    }

    // ── fetch existing customers ─────────────────────────────────────────────
    const { rows: customers } = await client.query(
      `SELECT id, name FROM customers`
    );

    // ── add more customers if fewer than 8 ───────────────────────────────────
    const extraCustomers = [
      { name: 'Priya Sharma',   phone: '9811223344', address: 'Nehru Colony' },
      { name: 'Suresh Gupta',   phone: '9922334455', address: 'Civil Lines' },
      { name: 'Anita Verma',    phone: '9833445566', address: 'Krishna Nagar' },
      { name: 'Deepak Mishra',  phone: '9744556677', address: 'Ram Nagar' },
      { name: 'Kavita Yadav',   phone: '9655667788', address: 'Saket Vihar' },
    ];
    for (const ec of extraCustomers) {
      const exists = await client.query(`SELECT id FROM customers WHERE phone=$1`, [ec.phone]);
      if (!exists.rows.length) {
        await client.query(
          `INSERT INTO customers (name, phone, address) VALUES ($1,$2,$3)`,
          [ec.name, ec.phone, ec.address]
        );
      }
    }

    const { rows: allCustomers } = await client.query(`SELECT id, name FROM customers`);

    // ── clear old bills/bill_items ────────────────────────────────────────────
    await client.query(`DELETE FROM bill_items`);
    await client.query(`DELETE FROM bills`);
    // also clear synthetic khata transactions, keep originals
    await client.query(`DELETE FROM khata_transactions`);

    console.log('Cleared old bills, bill_items, khata_transactions');

    // ── helper: insert one bill with items ───────────────────────────────────
    let billSeq = 1;
    async function insertBill(opts: {
      daysAgo: number;
      hour: number;
      min: number;
      paymentMethod: string;
      customerId?: number;
      customerName?: string;
      productPicks: { product: any; qty: number }[];
      discount?: number;
    }) {
      const ts = dateStr(opts.daysAgo, opts.hour, opts.min);
      const dayStr = ts.slice(0, 10).replace(/-/g, '');
      const billNumber = `BILL-${dayStr}-${String(billSeq++).padStart(3, '0')}`;

      let subtotal = 0;
      for (const pp of opts.productPicks) {
        subtotal += parseFloat(pp.product.selling_price) * pp.qty;
      }
      const discount = opts.discount ?? 0;
      const total = subtotal - discount;

      const { rows: billRows } = await client.query(
        `INSERT INTO bills (bill_number, customer_id, customer_name, subtotal, discount, gst_amount, total, payment_method, created_at)
         VALUES ($1,$2,$3,$4,$5,0,$6,$7,$8) RETURNING id`,
        [billNumber, opts.customerId ?? null, opts.customerName ?? null,
         subtotal, discount, total, opts.paymentMethod, ts]
      );
      const billId = billRows[0].id;

      for (const pp of opts.productPicks) {
        const itemTotal = parseFloat(pp.product.selling_price) * pp.qty;
        await client.query(
          `INSERT INTO bill_items (bill_id, product_id, product_name, quantity, unit, buying_price, selling_price, total)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [billId, pp.product.id, pp.product.name, pp.qty, pp.product.unit,
           parseFloat(pp.product.buying_price), parseFloat(pp.product.selling_price), itemTotal]
        );
      }

      if (opts.paymentMethod === 'khata' && opts.customerId) {
        await client.query(
          `INSERT INTO khata_transactions (customer_id, type, amount, description, created_at)
           VALUES ($1,'credit',$2,$3,$4)`,
          [opts.customerId, total, `Bill #${billId}`, ts]
        );
      }

      return { billId, total };
    }

    // ── seed 30 days of bills ────────────────────────────────────────────────
    const payMethods = ['cash','cash','cash','cash','upi','upi','khata'];

    let totalBillsInserted = 0;

    for (let day = 30; day >= 1; day--) {
      // 3–7 bills per day (weekends busier)
      const isWeekend = ((new Date().getDay() + day) % 7 < 2);
      const count = rnd(isWeekend ? 5 : 3, isWeekend ? 8 : 6);

      for (let b = 0; b < count; b++) {
        const hour = rnd(9, 20);
        const min = rnd(0, 59);
        const pMethod = pick(payMethods);
        const numItems = rnd(2, 4);
        const pickedProds: any[] = [];
        const usedIds = new Set<number>();
        while (pickedProds.length < numItems) {
          const p = pick(products);
          if (!usedIds.has(p.id)) { usedIds.add(p.id); pickedProds.push(p); }
        }
        const productPicks = pickedProds.map(p => ({ product: p, qty: rnd(1, 3) }));
        let customerId: number | undefined;
        let customerName: string | undefined;
        if (pMethod === 'khata' || Math.random() < 0.3) {
          const c = pick(allCustomers);
          customerId = c.id;
          customerName = c.name;
        }
        const discount = Math.random() < 0.15 ? rnd(5, 20) : 0;
        await insertBill({ daysAgo: day, hour, min, paymentMethod: pMethod, customerId, customerName, productPicks, discount });
        totalBillsInserted++;
      }
    }

    // ── today: 4–6 bills already done today ─────────────────────────────────
    const todayBillCount = rnd(4, 6);
    const todayHours = [9, 10, 11, 13, 15, 17, 19];
    for (let b = 0; b < todayBillCount; b++) {
      const hour = todayHours[b] ?? rnd(9, 18);
      const pMethod = pick(['cash','cash','upi','upi','cash']);
      const numItems = rnd(2, 4);
      const pickedProds: any[] = [];
      const usedIds = new Set<number>();
      while (pickedProds.length < numItems) {
        const p = pick(products);
        if (!usedIds.has(p.id)) { usedIds.add(p.id); pickedProds.push(p); }
      }
      const productPicks = pickedProds.map(p => ({ product: p, qty: rnd(1, 4) }));
      const custRoll = Math.random();
      let customerId: number | undefined;
      let customerName: string | undefined;
      if (custRoll < 0.35) {
        const c = pick(allCustomers);
        customerId = c.id;
        customerName = c.name;
      }
      await insertBill({ daysAgo: 0, hour, min: rnd(5, 55), paymentMethod: pMethod, customerId, customerName, productPicks });
      totalBillsInserted++;
    }

    console.log(`✅ Inserted ${totalBillsInserted} bills`);

    // ── rich khata transactions (non-bill entries) ───────────────────────────
    const khataEntries = [
      { daysAgo: 25, type: 'credit', amount: 450, desc: 'Grocery - Rice, Dal, Oil' },
      { daysAgo: 22, type: 'payment', amount: 200, desc: 'Cash payment received' },
      { daysAgo: 18, type: 'credit', amount: 320, desc: 'Atta, Sugar, Salt' },
      { daysAgo: 14, type: 'credit', amount: 180, desc: 'Milk, Biscuit, Noodles' },
      { daysAgo: 10, type: 'payment', amount: 300, desc: 'UPI payment - PhonePe' },
      { daysAgo: 7,  type: 'credit', amount: 275, desc: 'Soap, Toothpaste, Detergent' },
      { daysAgo: 4,  type: 'credit', amount: 560, desc: 'Monthly ration' },
      { daysAgo: 2,  type: 'payment', amount: 400, desc: 'Partial payment cash' },
      { daysAgo: 1,  type: 'credit', amount: 135, desc: 'Snacks and drinks' },
    ];

    for (let ci = 0; ci < allCustomers.length; ci++) {
      const cust = allCustomers[ci];
      for (let ei = ci % 2; ei < khataEntries.length; ei += (ci % 3 === 0 ? 2 : 3)) {
        const e = khataEntries[ei];
        const ts = dateStr(e.daysAgo, rnd(9, 20), rnd(5, 55));
        await client.query(
          `INSERT INTO khata_transactions (customer_id, type, amount, description, created_at)
           VALUES ($1,$2,$3,$4,$5)`,
          [cust.id, e.type, e.amount, e.desc, ts]
        );
      }
    }

    console.log('✅ Inserted khata transactions');

    // ── update settings with full shop info ──────────────────────────────────
    await client.query(
      `INSERT INTO app_settings (id, shop_name, shop_address, shop_phone, owner_name, gst_enabled, currency, low_stock_threshold)
       VALUES (1,'Smart Kirana Store','Gandhi Nagar, Ward No. 5, Delhi','9876543210','Ramesh Kumar',false,'₹',5)
       ON CONFLICT (id) DO UPDATE SET
         shop_name=EXCLUDED.shop_name, shop_address=EXCLUDED.shop_address,
         shop_phone=EXCLUDED.shop_phone, owner_name=EXCLUDED.owner_name,
         updated_at=NOW()`
    );

    console.log('✅ Settings updated');
    console.log('\n🎉 Demo seed complete! Refresh the app to see live data.');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(e => { console.error(e); process.exit(1); });
