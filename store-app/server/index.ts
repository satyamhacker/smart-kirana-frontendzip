import express from "express";
import pkg from "pg";
const { Pool } = pkg;

const app = express();
app.use(express.json());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ── helpers ────────────────────────────────────────────────────────────────
function daysAgo(n: number, h = 10, m = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

// ── seed ───────────────────────────────────────────────────────────────────
async function seedIfEmpty() {
  const { rows } = await pool.query("SELECT COUNT(*) FROM products");
  if (parseInt(rows[0].count) > 0) return;

  const products = [
    ["Tata Salt 1kg",             "8901234567890", "Grocery",       18,  22,  45, 10, "pcs"],
    ["Aashirvaad Atta 5kg",       "8902345678901", "Grocery",       195, 225, 12,  5, "pcs"],
    ["Amul Butter 100g",          "8903456789012", "Dairy",         52,  62,   9,  5, "pcs"],
    ["Parle-G Biscuit 800g",      "8904567890123", "Snacks",        58,  72,   0,  5, "pcs"],
    ["Surf Excel Matic 500g",     "8905678901234", "Household",     85,  105, 20,  5, "pcs"],
    ["Maggi Noodles 70g",         "8906789012345", "Instant Food",  12,  15,  35, 10, "pcs"],
    ["MDH Garam Masala 100g",     "8907890123456", "Spices",        55,  72,  18,  5, "pcs"],
    ["Dettol Soap 125g",          "8908901234567", "Personal Care", 38,  50,   3,  5, "pcs"],
    ["Colgate StrongTeeth 200g",  "8909012345678", "Personal Care", 65,  85,  25,  5, "pcs"],
    ["Bisleri Water 1L",          "8900123456789", "Beverages",     15,  20,  60, 10, "pcs"],
    ["Haldiram Bhujia 200g",      "8911234567890", "Snacks",        45,  60,  14,  5, "pcs"],
    ["Toor Dal 1kg",              "8912345678901", "Pulses",        145, 168,  2,  5, "kg"],
    ["Saffola Gold Oil 1L",       "8913456789012", "Oil",           155, 182,  8,  3, "pcs"],
    ["Nestle KitKat 2F",          "8914567890123", "Chocolate",     22,  30,  40, 10, "pcs"],
    ["Good Day Butter Cookies 150g","8915678901235","Snacks",       28,  38,  22,  5, "pcs"],
    ["Lifebuoy Handwash 200ml",   "8916789012346", "Personal Care", 72,  90,  16,  5, "pcs"],
    ["Kurkure Masala Munch 90g",  "8917890123457", "Snacks",        18,  25,  50, 10, "pcs"],
    ["Pooja Basmati Rice 5kg",    "8918901234568", "Grocery",       285, 330,  7,  3, "pcs"],
  ] as const;

  const productIds: number[] = [];
  for (const [name, barcode, cat, pp, sp, stock, thresh, unit] of products) {
    const r = await pool.query(
      `INSERT INTO products (name,barcode,category,purchase_price,selling_price,current_stock,low_stock_threshold,unit)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      [name, barcode, cat, pp, sp, stock, thresh, unit]
    );
    productIds.push(r.rows[0].id);
  }

  // seed customers
  type CustSeed = { name: string; phone: string; address: string; due: number; txs: { type: string; amount: number; desc: string; daysBack: number }[] };
  const custSeeds: CustSeed[] = [
    { name: "Ravi Kumar",   phone: "9876543210", address: "Gandhi Nagar",  due: 450,  txs: [{ type:"credit", amount:750, desc:"Grocery items",       daysBack:20 }, { type:"payment", amount:300, desc:"Cash payment",        daysBack:15 }] },
    { name: "Sunita Devi",  phone: "9845123456", address: "Shastri Chowk", due: 0,    txs: [{ type:"credit", amount:520, desc:"Dal, Rice, Oil",       daysBack:30 }, { type:"payment", amount:520, desc:"Full payment UPI",    daysBack:28 }] },
    { name: "Mohit Sharma", phone: "9912345678", address: "Ram Nagar",     due: 1200, txs: [{ type:"credit", amount:850, desc:"Monthly kirana",       daysBack:25 }, { type:"credit", amount:620, desc:"Masala, Oil, Soap",  daysBack:10 }, { type:"payment", amount:270, desc:"Partial payment",     daysBack:5  }] },
    { name: "Priya Singh",  phone: "9867890123", address: "Nehru Colony",  due: 0,    txs: [{ type:"credit", amount:340, desc:"Biscuits, Snacks",     daysBack:14 }, { type:"payment", amount:340, desc:"Cash payment",        daysBack:12 }] },
    { name: "Deepak Yadav", phone: "9834567890", address: "Civil Lines",   due: 850,  txs: [{ type:"credit", amount:1150,desc:"Atta, Dal, Oil, Salt", daysBack:18 }, { type:"payment", amount:300, desc:"Cash payment",        daysBack:8  }] },
    { name: "Anjali Gupta", phone: "9878901234", address: "Model Town",    due: 320,  txs: [{ type:"credit", amount:320, desc:"Dairy items, Maggi",   daysBack:7  }] },
  ];

  const custIds: number[] = [];
  for (const c of custSeeds) {
    const cr = await pool.query(
      `INSERT INTO customers (name,phone,address,total_due) VALUES ($1,$2,$3,$4) RETURNING id`,
      [c.name, c.phone, c.address, c.due]
    );
    const cid = cr.rows[0].id;
    custIds.push(cid);
    for (const tx of c.txs) {
      await pool.query(
        `INSERT INTO khata_transactions (customer_id,type,amount,description,created_at) VALUES ($1,$2,$3,$4,$5)`,
        [cid, tx.type, tx.amount, tx.desc, daysAgo(tx.daysBack)]
      );
    }
  }

  // seed bills
  const pid = (i: number) => productIds[i - 1]; // 1-indexed like seed data
  const cid = (i: number) => custIds[i - 1];
  type BillSeed = { db: number; h: number; items: [number,number][]; mode: string; cIdx?: number; cName?: string; disc?: number };
  const billSeeds: BillSeed[] = [
    { db:0,  h:9,  items:[[1,2],[6,3]],           mode:"cash" },
    { db:0,  h:10, items:[[10,5],[14,2]],          mode:"upi"  },
    { db:0,  h:11, items:[[2,1],[7,1],[1,1]],      mode:"cash", disc:10 },
    { db:0,  h:12, items:[[9,1],[8,2]],            mode:"upi",   cIdx:2, cName:"Sunita Devi" },
    { db:0,  h:14, items:[[13,1],[12,1]],          mode:"khata", cIdx:3, cName:"Mohit Sharma" },
    { db:0,  h:16, items:[[17,4],[15,2]],          mode:"cash" },
    { db:1,  h:9,  items:[[1,3],[5,1]],            mode:"cash" },
    { db:1,  h:11, items:[[6,5],[14,3]],           mode:"upi"  },
    { db:1,  h:13, items:[[2,1],[18,1]],           mode:"cash", cIdx:1, cName:"Ravi Kumar", disc:20 },
    { db:1,  h:15, items:[[10,6],[16,1]],          mode:"upi"  },
    { db:1,  h:17, items:[[9,1],[7,1]],            mode:"cash" },
    { db:2,  h:10, items:[[3,2],[6,4]],            mode:"cash" },
    { db:2,  h:12, items:[[13,1],[1,2]],           mode:"upi"  },
    { db:2,  h:14, items:[[11,2],[15,1]],          mode:"cash" },
    { db:2,  h:16, items:[[2,1],[7,2]],            mode:"khata", cIdx:5, cName:"Deepak Yadav" },
    { db:3,  h:9,  items:[[10,8],[14,4]],          mode:"cash" },
    { db:3,  h:11, items:[[5,1],[9,1]],            mode:"upi",  disc:15 },
    { db:3,  h:15, items:[[17,3],[6,2]],           mode:"cash" },
    { db:4,  h:10, items:[[1,4],[12,1]],           mode:"upi"  },
    { db:4,  h:13, items:[[18,1],[3,1]],           mode:"cash" },
    { db:4,  h:16, items:[[11,3],[14,2]],          mode:"upi"  },
    { db:5,  h:9,  items:[[2,1],[1,2],[7,1]],      mode:"cash", disc:5 },
    { db:5,  h:12, items:[[10,10],[6,3]],          mode:"upi"  },
    { db:5,  h:17, items:[[9,1],[16,1]],           mode:"cash", cIdx:6, cName:"Anjali Gupta" },
    { db:6,  h:10, items:[[13,1],[5,1]],           mode:"upi"  },
    { db:6,  h:14, items:[[17,5],[15,2]],          mode:"cash" },
    { db:7,  h:9,  items:[[1,3],[6,4],[10,2]],     mode:"cash" },
    { db:7,  h:13, items:[[2,1],[12,1]],           mode:"khata", cIdx:1, cName:"Ravi Kumar" },
    { db:7,  h:16, items:[[9,2],[7,1]],            mode:"upi"  },
    { db:8,  h:10, items:[[11,2],[14,5]],          mode:"cash" },
    { db:8,  h:15, items:[[18,1],[1,2]],           mode:"upi"  },
    { db:9,  h:9,  items:[[3,3],[16,1]],           mode:"cash" },
    { db:9,  h:12, items:[[5,1],[6,5]],            mode:"upi",  disc:10 },
    { db:9,  h:17, items:[[13,1],[17,3]],          mode:"cash" },
    { db:10, h:10, items:[[2,1],[7,2],[1,3]],      mode:"cash" },
    { db:10, h:14, items:[[10,6],[14,4]],          mode:"upi"  },
    { db:11, h:11, items:[[9,1],[15,2]],           mode:"cash" },
    { db:11, h:16, items:[[12,2],[18,1]],          mode:"khata", cIdx:3, cName:"Mohit Sharma" },
    { db:12, h:9,  items:[[1,5],[6,6]],            mode:"cash" },
    { db:12, h:13, items:[[11,3],[17,4]],          mode:"upi"  },
    { db:12, h:17, items:[[5,1],[9,1]],            mode:"cash" },
    { db:13, h:10, items:[[13,1],[3,2]],           mode:"upi"  },
    { db:13, h:15, items:[[2,1],[7,1],[16,1]],     mode:"cash", disc:20 },
    { db:14, h:9,  items:[[10,8],[6,4]],           mode:"cash" },
    { db:14, h:12, items:[[14,6],[15,3]],          mode:"upi"  },
    { db:14, h:16, items:[[1,4],[12,1]],           mode:"cash" },
    { db:15, h:10, items:[[2,1],[6,3]],            mode:"upi"  },
    { db:15, h:14, items:[[9,1],[17,2]],           mode:"cash" },
    { db:16, h:11, items:[[13,1],[1,3]],           mode:"cash" },
    { db:16, h:15, items:[[11,4],[10,5]],          mode:"upi"  },
    { db:17, h:9,  items:[[3,2],[7,1]],            mode:"cash" },
    { db:17, h:13, items:[[18,1],[15,2]],          mode:"khata", cIdx:5, cName:"Deepak Yadav" },
    { db:18, h:10, items:[[6,5],[14,3]],           mode:"upi"  },
    { db:18, h:16, items:[[5,1],[1,2]],            mode:"cash" },
    { db:19, h:11, items:[[2,1],[16,1]],           mode:"cash" },
    { db:19, h:15, items:[[12,1],[9,1]],           mode:"upi"  },
    { db:20, h:10, items:[[10,10],[17,4]],         mode:"cash" },
    { db:20, h:14, items:[[13,1],[7,2]],           mode:"upi"  },
    { db:21, h:9,  items:[[1,6],[6,4]],            mode:"cash" },
    { db:21, h:13, items:[[11,2],[15,3]],          mode:"upi"  },
    { db:22, h:11, items:[[3,3],[18,1]],           mode:"cash", disc:15 },
    { db:22, h:16, items:[[14,5],[10,4]],          mode:"upi"  },
    { db:23, h:10, items:[[2,1],[5,1]],            mode:"cash" },
    { db:23, h:15, items:[[9,2],[7,1]],            mode:"upi"  },
    { db:24, h:9,  items:[[1,4],[17,5]],           mode:"cash" },
    { db:24, h:14, items:[[13,1],[12,1]],          mode:"khata", cIdx:3, cName:"Mohit Sharma" },
    { db:25, h:11, items:[[6,6],[15,2]],           mode:"cash" },
    { db:25, h:16, items:[[16,1],[3,2]],           mode:"upi"  },
    { db:26, h:10, items:[[10,7],[14,4]],          mode:"cash" },
    { db:27, h:9,  items:[[2,1],[1,3],[7,1]],      mode:"upi"  },
    { db:28, h:11, items:[[11,3],[9,1]],           mode:"cash" },
    { db:28, h:15, items:[[18,1],[5,1]],           mode:"upi"  },
    { db:29, h:10, items:[[13,1],[17,3]],          mode:"cash" },
    { db:29, h:14, items:[[6,4],[14,3]],           mode:"upi"  },
  ];

  // get selling prices for bill calculation
  const priceMap = new Map<number, { sell: number; buy: number }>();
  for (let i = 0; i < products.length; i++) {
    priceMap.set(i + 1, { sell: products[i][4] as number, buy: products[i][3] as number });
  }

  for (const b of billSeeds) {
    const createdAt = daysAgo(b.db, b.h, 30);
    const items = b.items.map(([pIdx, qty]) => {
      const price = priceMap.get(pIdx)!;
      return { productId: pIdx, qty, unitPrice: price.sell, total: price.sell * qty };
    });
    const totalAmount = items.reduce((s, i) => s + i.total, 0);
    const discount = b.disc ?? 0;
    const finalAmount = totalAmount - discount;
    const custId = b.cIdx ? cid(b.cIdx) : null;

    const br = await pool.query(
      `INSERT INTO bills (customer_id,customer_name,total_amount,discount_amount,final_amount,payment_mode,created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [custId, b.cName ?? null, totalAmount, discount, finalAmount, b.mode, createdAt]
    );
    const billId = br.rows[0].id;
    for (const item of items) {
      await pool.query(
        `INSERT INTO bill_items (bill_id,product_id,quantity,unit_price,total_price) VALUES ($1,$2,$3,$4,$5)`,
        [billId, productIds[item.productId - 1], item.qty, item.unitPrice, item.total]
      );
    }
  }

  console.log("✅ Seed complete");
}

// ── PRODUCTS ───────────────────────────────────────────────────────────────
app.get("/api/products", async (req, res) => {
  try {
    const search = (req.query.search as string | undefined)?.trim();
    let query = "SELECT * FROM products";
    const params: string[] = [];
    if (search) {
      query += " WHERE name ILIKE $1 OR barcode ILIKE $1 OR category ILIKE $1";
      params.push(`%${search}%`);
    }
    query += " ORDER BY name";
    const { rows } = await pool.query(query, params);
    res.json(rows.map(toProduct));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post("/api/products", async (req, res) => {
  try {
    const { name, barcode, category, purchasePrice, sellingPrice, currentStock, lowStockThreshold, unit } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO products (name,barcode,category,purchase_price,selling_price,current_stock,low_stock_threshold,unit)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [name, barcode || null, category, purchasePrice, sellingPrice, currentStock, lowStockThreshold, unit]
    );
    res.json(toProduct(rows[0]));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.put("/api/products/:id", async (req, res) => {
  try {
    const { name, barcode, category, purchasePrice, sellingPrice, currentStock, lowStockThreshold, unit } = req.body;
    const { rows } = await pool.query(
      `UPDATE products SET name=$1,barcode=$2,category=$3,purchase_price=$4,selling_price=$5,
       current_stock=$6,low_stock_threshold=$7,unit=$8 WHERE id=$9 RETURNING *`,
      [name, barcode || null, category, purchasePrice, sellingPrice, currentStock, lowStockThreshold, unit, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Not found" });
    res.json(toProduct(rows[0]));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.delete("/api/products/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM products WHERE id=$1", [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// ── CUSTOMERS ──────────────────────────────────────────────────────────────
app.get("/api/customers", async (req, res) => {
  try {
    const search = (req.query.search as string | undefined)?.trim();
    let query = "SELECT * FROM customers";
    const params: string[] = [];
    if (search) {
      query += " WHERE name ILIKE $1 OR phone ILIKE $1";
      params.push(`%${search}%`);
    }
    query += " ORDER BY name";
    const { rows } = await pool.query(query, params);
    res.json(rows.map(toCustomer));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post("/api/customers", async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO customers (name,phone,address) VALUES ($1,$2,$3) RETURNING *`,
      [name, phone, address || null]
    );
    res.json(toCustomer(rows[0]));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.get("/api/customers/:id", async (req, res) => {
  try {
    const { rows: cr } = await pool.query("SELECT * FROM customers WHERE id=$1", [req.params.id]);
    if (!cr[0]) return res.status(404).json({ error: "Not found" });
    const { rows: txs } = await pool.query(
      "SELECT * FROM khata_transactions WHERE customer_id=$1 ORDER BY created_at ASC",
      [req.params.id]
    );
    res.json({ ...toCustomer(cr[0]), transactions: txs.map(toTx) });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.delete("/api/customers/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM customers WHERE id=$1", [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post("/api/customers/:id/transactions", async (req, res) => {
  try {
    const { type, amount, description } = req.body;
    const cid = Number(req.params.id);
    const { rows: cr } = await pool.query("SELECT total_due FROM customers WHERE id=$1", [cid]);
    if (!cr[0]) return res.status(404).json({ error: "Not found" });
    const newDue = type === "credit"
      ? Number(cr[0].total_due) + Number(amount)
      : Math.max(0, Number(cr[0].total_due) - Number(amount));
    await pool.query("UPDATE customers SET total_due=$1 WHERE id=$2", [newDue, cid]);
    const { rows } = await pool.query(
      `INSERT INTO khata_transactions (customer_id,type,amount,description) VALUES ($1,$2,$3,$4) RETURNING *`,
      [cid, type, amount, description]
    );
    res.json(toTx(rows[0]));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// ── BILLS ──────────────────────────────────────────────────────────────────
app.get("/api/bills", async (req, res) => {
  try {
    const { rows: bills } = await pool.query("SELECT * FROM bills ORDER BY created_at DESC");
    const { rows: items } = await pool.query("SELECT * FROM bill_items");
    const itemsByBill = new Map<number, typeof items>();
    for (const item of items) {
      if (!itemsByBill.has(item.bill_id)) itemsByBill.set(item.bill_id, []);
      itemsByBill.get(item.bill_id)!.push(item);
    }
    res.json(bills.map(b => toBill(b, itemsByBill.get(b.id) ?? [])));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post("/api/bills", async (req, res) => {
  try {
    const { customerId, items, totalAmount, discountAmount, finalAmount, paymentMode } = req.body;
    let customerName: string | null = null;
    if (customerId) {
      const { rows } = await pool.query("SELECT name FROM customers WHERE id=$1", [customerId]);
      customerName = rows[0]?.name ?? null;
    }
    const { rows: br } = await pool.query(
      `INSERT INTO bills (customer_id,customer_name,total_amount,discount_amount,final_amount,payment_mode)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [customerId ?? null, customerName, totalAmount, discountAmount, finalAmount, paymentMode]
    );
    const bill = br[0];
    const savedItems = [];
    for (const item of items) {
      const { rows: ir } = await pool.query(
        `INSERT INTO bill_items (bill_id,product_id,quantity,unit_price,total_price) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [bill.id, item.productId, item.quantity, item.unitPrice, item.totalPrice]
      );
      savedItems.push(ir[0]);
      await pool.query(
        "UPDATE products SET current_stock = GREATEST(0, current_stock - $1) WHERE id=$2",
        [item.quantity, item.productId]
      );
    }
    if (paymentMode === "khata" && customerId) {
      await pool.query("UPDATE customers SET total_due = total_due + $1 WHERE id=$2", [finalAmount, customerId]);
      await pool.query(
        `INSERT INTO khata_transactions (customer_id,type,amount,description) VALUES ($1,'credit',$2,$3)`,
        [customerId, finalAmount, `Bill #${bill.id}`]
      );
    }
    res.json(toBill(bill, savedItems));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// ── DASHBOARD ──────────────────────────────────────────────────────────────
app.get("/api/dashboard", async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split("T")[0];

    const { rows: todayBills } = await pool.query(
      "SELECT * FROM bills WHERE created_at::date = $1::date", [todayStr]
    );
    const { rows: todayItems } = await pool.query(
      `SELECT bi.*, p.purchase_price FROM bill_items bi
       JOIN bills b ON b.id=bi.bill_id JOIN products p ON p.id=bi.product_id
       WHERE b.created_at::date = $1::date`, [todayStr]
    );
    const todaySale = todayBills.reduce((s: number, b: any) => s + Number(b.final_amount), 0);
    const todayOrderCount = todayBills.length;
    let todayProfit = 0;
    for (const item of todayItems) {
      todayProfit += (Number(item.unit_price) - Number(item.purchase_price)) * item.quantity;
    }
    const totalDiscount = todayBills.reduce((s: number, b: any) => s + Number(b.discount_amount), 0);
    todayProfit -= totalDiscount;

    const { rows: pendingCusts } = await pool.query("SELECT id, total_due FROM customers WHERE total_due > 0");
    const pendingKhataAmount = pendingCusts.reduce((s: number, c: any) => s + Number(c.total_due), 0);

    const { rows: lowStock } = await pool.query(
      "SELECT * FROM products WHERE current_stock <= low_stock_threshold ORDER BY current_stock ASC"
    );
    const { rows: recentBills } = await pool.query("SELECT * FROM bills ORDER BY created_at DESC LIMIT 10");
    const { rows: recentItems } = await pool.query(
      `SELECT * FROM bill_items WHERE bill_id = ANY($1::int[])`,
      [recentBills.map((b: any) => b.id)]
    );
    const itemsByBill2 = new Map<number, any[]>();
    for (const item of recentItems) {
      if (!itemsByBill2.has(item.bill_id)) itemsByBill2.set(item.bill_id, []);
      itemsByBill2.get(item.bill_id)!.push(item);
    }

    res.json({
      todaySale,
      todayProfit: Math.max(0, todayProfit),
      todayOrderCount,
      pendingKhataAmount,
      pendingKhataCount: pendingCusts.length,
      lowStockCount: lowStock.length,
      outOfStockCount: lowStock.filter((p: any) => p.current_stock === 0).length,
      recentBills: recentBills.map((b: any) => ({
        id: b.id, customerName: b.customer_name, finalAmount: Number(b.final_amount),
        paymentMode: b.payment_mode, createdAt: b.created_at,
      })),
      lowStockProducts: lowStock.map((p: any) => ({
        id: p.id, name: p.name, category: p.category,
        currentStock: p.current_stock, lowStockThreshold: p.low_stock_threshold, unit: p.unit,
      })),
    });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// ── REPORTS ────────────────────────────────────────────────────────────────
app.get("/api/reports/sales", async (req, res) => {
  try {
    const from = req.query.from ? new Date(req.query.from as string) : new Date(0);
    const toRaw = req.query.to as string | undefined;
    const to = toRaw
      ? (toRaw.includes("T") ? new Date(toRaw) : new Date(toRaw + "T23:59:59"))
      : new Date();

    const { rows } = await pool.query(
      `SELECT b.id, b.final_amount, b.created_at FROM bills b
       WHERE b.created_at >= $1 AND b.created_at <= $2 ORDER BY b.created_at`, [from, to]
    );
    const byDate = new Map<string, { sales: number; orders: number }>();
    for (const b of rows) {
      const date = new Date(b.created_at).toISOString().split("T")[0];
      const cur = byDate.get(date) ?? { sales: 0, orders: 0 };
      byDate.set(date, { sales: cur.sales + Number(b.final_amount), orders: cur.orders + 1 });
    }
    res.json({
      totalSales: rows.reduce((s: number, b: any) => s + Number(b.final_amount), 0),
      orderCount: rows.length,
      data: Array.from(byDate.entries()).sort(([a],[b]) => a.localeCompare(b)).map(([date,v]) => ({ date, ...v })),
    });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.get("/api/reports/profit", async (req, res) => {
  try {
    const from = req.query.from ? new Date(req.query.from as string) : new Date(0);
    const toRaw = req.query.to as string | undefined;
    const to = toRaw
      ? (toRaw.includes("T") ? new Date(toRaw) : new Date(toRaw + "T23:59:59"))
      : new Date();

    const { rows } = await pool.query(
      `SELECT b.id, b.final_amount, b.discount_amount, b.created_at,
              json_agg(json_build_object('unitPrice', bi.unit_price, 'qty', bi.quantity, 'buyPrice', p.purchase_price)) as items
       FROM bills b
       JOIN bill_items bi ON bi.bill_id=b.id
       JOIN products p ON p.id=bi.product_id
       WHERE b.created_at >= $1 AND b.created_at <= $2
       GROUP BY b.id ORDER BY b.created_at`, [from, to]
    );
    const byDate = new Map<string, { revenue: number; profit: number }>();
    let totalRevenue = 0, totalProfit = 0;
    for (const b of rows) {
      const date = new Date(b.created_at).toISOString().split("T")[0];
      const cur = byDate.get(date) ?? { revenue: 0, profit: 0 };
      let bProfit = 0;
      for (const item of b.items) {
        bProfit += (Number(item.unitPrice) - Number(item.buyPrice)) * Number(item.qty);
      }
      bProfit -= Number(b.discount_amount);
      byDate.set(date, { revenue: cur.revenue + Number(b.final_amount), profit: cur.profit + bProfit });
      totalRevenue += Number(b.final_amount);
      totalProfit += bProfit;
    }
    res.json({
      totalRevenue, totalProfit: Math.max(0, totalProfit),
      profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
      data: Array.from(byDate.entries()).sort(([a],[b]) => a.localeCompare(b)).map(([date,v]) => ({ date, ...v })),
    });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.get("/api/reports/khata", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM customers WHERE total_due > 0 ORDER BY total_due DESC");
    res.json({
      totalPending: rows.reduce((s: number, c: any) => s + Number(c.total_due), 0),
      customerCount: rows.length,
      customers: rows.map((c: any) => ({ id: c.id, name: c.name, phone: c.phone, totalDue: Number(c.total_due) })),
    });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.get("/api/reports/lowstock", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM products WHERE current_stock <= low_stock_threshold ORDER BY current_stock ASC"
    );
    res.json(rows.map(toProduct));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// ── SETTINGS ───────────────────────────────────────────────────────────────
app.get("/api/settings", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT key, value FROM app_settings");
    const s: Record<string, string> = {};
    for (const r of rows) s[r.key] = r.value;
    res.json(s);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.put("/api/settings", async (req, res) => {
  try {
    for (const [key, value] of Object.entries(req.body)) {
      await pool.query(
        `INSERT INTO app_settings (key,value) VALUES ($1,$2) ON CONFLICT (key) DO UPDATE SET value=$2`,
        [key, String(value)]
      );
    }
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// ── Row mappers ────────────────────────────────────────────────────────────
function toProduct(r: any) {
  return {
    id: r.id, name: r.name, barcode: r.barcode ?? undefined,
    category: r.category, purchasePrice: Number(r.purchase_price),
    sellingPrice: Number(r.selling_price), currentStock: r.current_stock,
    lowStockThreshold: r.low_stock_threshold, unit: r.unit,
    createdAt: r.created_at,
  };
}
function toCustomer(r: any) {
  return {
    id: r.id, name: r.name, phone: r.phone, address: r.address ?? undefined,
    totalDue: Number(r.total_due), createdAt: r.created_at,
  };
}
function toTx(r: any) {
  return { id: r.id, type: r.type, amount: Number(r.amount), description: r.description, createdAt: r.created_at };
}
function toBill(b: any, items: any[]) {
  return {
    id: b.id, customerId: b.customer_id ?? undefined, customerName: b.customer_name ?? undefined,
    totalAmount: Number(b.total_amount), discountAmount: Number(b.discount_amount),
    finalAmount: Number(b.final_amount), paymentMode: b.payment_mode, createdAt: b.created_at,
    items: items.map(i => ({
      productId: i.product_id, quantity: i.quantity,
      unitPrice: Number(i.unit_price), totalPrice: Number(i.total_price),
    })),
  };
}

// ── Start ──────────────────────────────────────────────────────────────────
const PORT = Number(process.env.API_PORT) || 5001;
pool.connect()
  .then(() => seedIfEmpty())
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => console.log(`API server running on port ${PORT}`));
  })
  .catch((e: Error) => { console.error("DB connect failed:", e.message); process.exit(1); });
