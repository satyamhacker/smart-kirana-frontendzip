import { useQuery, useMutation, type UseQueryOptions } from "@tanstack/react-query";

// ─── Types ───────────────────────────────────────────────────────────────────

export type Product = {
  id: number;
  name: string;
  barcode?: string;
  category: string;
  purchasePrice: number;
  sellingPrice: number;
  currentStock: number;
  lowStockThreshold: number;
  unit: string;
  createdAt: string;
};

export type Customer = {
  id: number;
  name: string;
  phone: string;
  address?: string;
  totalDue: number;
  createdAt: string;
};

export type CustomerDetail = Customer & {
  transactions: KhataTransaction[];
};

export type KhataTransaction = {
  id: number;
  type: "credit" | "payment";
  amount: number;
  description: string;
  createdAt: string;
};

export type BillInputPaymentMode = "cash" | "upi" | "khata";

export type BillItem = {
  productId: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

export type BillInput = {
  customerId?: number;
  items: BillItem[];
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  paymentMode: BillInputPaymentMode;
};

export type Bill = {
  id: number;
  customerId?: number;
  customerName?: string;
  items: BillItem[];
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  paymentMode: BillInputPaymentMode;
  createdAt: string;
};

export type PurchaseItemInput = {
  productId: number;
  quantity: number;
  unitCost: number;
  totalCost: number;
};

export type PurchaseInput = {
  supplierName: string;
  notes?: string;
  totalAmount: number;
  items: PurchaseItemInput[];
};

export type Purchase = {
  id: number;
  supplierName: string;
  notes?: string;
  totalAmount: number;
  items: PurchaseItemInput[];
  createdAt: string;
};

export type DashboardSummary = {
  todaySale: number;
  todayProfit: number;
  todayOrderCount: number;
  pendingKhataAmount: number;
  pendingKhataCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  recentBills: {
    id: number;
    customerName?: string;
    finalAmount: number;
    paymentMode: BillInputPaymentMode;
    createdAt: string;
  }[];
  lowStockProducts: {
    id: number;
    name: string;
    category: string;
    currentStock: number;
    lowStockThreshold: number;
    unit: string;
  }[];
};

// ─── Storage Helpers ─────────────────────────────────────────────────────────

function getStore<T>(key: string, defaultValue: T): T {
  try {
    const val = localStorage.getItem(key);
    return val ? (JSON.parse(val) as T) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setStore<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

let nextId = (() => {
  try {
    return parseInt(localStorage.getItem("kirana_next_id") || "1", 10);
  } catch {
    return 1;
  }
})();

function genId(): number {
  const id = nextId++;
  localStorage.setItem("kirana_next_id", String(nextId));
  return id;
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

function daysAgo(n: number, hour = 10, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function seedData() {
  if (localStorage.getItem("kirana_seeded_v2")) return;

  // ── Products ──
  const products: Product[] = [
    { id: 1,  name: "Tata Salt 1kg",             barcode: "8901234567890", category: "Grocery",       purchasePrice: 18,  sellingPrice: 22,  currentStock: 45, lowStockThreshold: 10, unit: "pcs",    createdAt: daysAgo(60) },
    { id: 2,  name: "Aashirvaad Atta 5kg",        barcode: "8902345678901", category: "Grocery",       purchasePrice: 195, sellingPrice: 225, currentStock: 12, lowStockThreshold: 5,  unit: "pcs",    createdAt: daysAgo(60) },
    { id: 3,  name: "Amul Butter 100g",           barcode: "8903456789012", category: "Dairy",         purchasePrice: 52,  sellingPrice: 62,  currentStock: 9,  lowStockThreshold: 5,  unit: "pcs",    createdAt: daysAgo(60) },
    { id: 4,  name: "Parle-G Biscuit 800g",       barcode: "8904567890123", category: "Snacks",        purchasePrice: 58,  sellingPrice: 72,  currentStock: 0,  lowStockThreshold: 5,  unit: "pcs",    createdAt: daysAgo(60) },
    { id: 5,  name: "Surf Excel Matic 500g",      barcode: "8905678901234", category: "Household",     purchasePrice: 85,  sellingPrice: 105, currentStock: 20, lowStockThreshold: 5,  unit: "pcs",    createdAt: daysAgo(60) },
    { id: 6,  name: "Maggi Noodles 70g",          barcode: "8906789012345", category: "Instant Food",  purchasePrice: 12,  sellingPrice: 15,  currentStock: 35, lowStockThreshold: 10, unit: "pcs",    createdAt: daysAgo(60) },
    { id: 7,  name: "MDH Garam Masala 100g",      barcode: "8907890123456", category: "Spices",        purchasePrice: 55,  sellingPrice: 72,  currentStock: 18, lowStockThreshold: 5,  unit: "pcs",    createdAt: daysAgo(60) },
    { id: 8,  name: "Dettol Soap 125g",           barcode: "8908901234567", category: "Personal Care", purchasePrice: 38,  sellingPrice: 50,  currentStock: 3,  lowStockThreshold: 5,  unit: "pcs",    createdAt: daysAgo(60) },
    { id: 9,  name: "Colgate StrongTeeth 200g",   barcode: "8909012345678", category: "Personal Care", purchasePrice: 65,  sellingPrice: 85,  currentStock: 25, lowStockThreshold: 5,  unit: "pcs",    createdAt: daysAgo(60) },
    { id: 10, name: "Bisleri Water 1L",           barcode: "8900123456789", category: "Beverages",     purchasePrice: 15,  sellingPrice: 20,  currentStock: 60, lowStockThreshold: 10, unit: "pcs",    createdAt: daysAgo(60) },
    { id: 11, name: "Haldiram Bhujia 200g",       barcode: "8911234567890", category: "Snacks",        purchasePrice: 45,  sellingPrice: 60,  currentStock: 14, lowStockThreshold: 5,  unit: "pcs",    createdAt: daysAgo(60) },
    { id: 12, name: "Toor Dal 1kg",               barcode: "8912345678901", category: "Pulses",        purchasePrice: 145, sellingPrice: 168, currentStock: 2,  lowStockThreshold: 5,  unit: "kg",     createdAt: daysAgo(60) },
    { id: 13, name: "Saffola Gold Oil 1L",        barcode: "8913456789012", category: "Oil",           purchasePrice: 155, sellingPrice: 182, currentStock: 8,  lowStockThreshold: 3,  unit: "pcs",    createdAt: daysAgo(60) },
    { id: 14, name: "Nestle KitKat 2F",           barcode: "8914567890123", category: "Chocolate",     purchasePrice: 22,  sellingPrice: 30,  currentStock: 40, lowStockThreshold: 10, unit: "pcs",    createdAt: daysAgo(60) },
    { id: 15, name: "Good Day Butter Cookies 150g", barcode: "8915678901235", category: "Snacks",      purchasePrice: 28,  sellingPrice: 38,  currentStock: 22, lowStockThreshold: 5,  unit: "pcs",    createdAt: daysAgo(60) },
    { id: 16, name: "Lifebuoy Handwash 200ml",    barcode: "8916789012346", category: "Personal Care", purchasePrice: 72,  sellingPrice: 90,  currentStock: 16, lowStockThreshold: 5,  unit: "pcs",    createdAt: daysAgo(55) },
    { id: 17, name: "Kurkure Masala Munch 90g",   barcode: "8917890123457", category: "Snacks",        purchasePrice: 18,  sellingPrice: 25,  currentStock: 50, lowStockThreshold: 10, unit: "pcs",    createdAt: daysAgo(55) },
    { id: 18, name: "Pooja Basmati Rice 5kg",     barcode: "8918901234568", category: "Grocery",       purchasePrice: 285, sellingPrice: 330, currentStock: 7,  lowStockThreshold: 3,  unit: "pcs",    createdAt: daysAgo(50) },
  ];

  // ── Customers ──
  const customers: CustomerDetail[] = [
    {
      id: 101, name: "Ravi Kumar",   phone: "9876543210", address: "Gandhi Nagar", totalDue: 450,
      createdAt: daysAgo(45),
      transactions: [
        { id: 201, type: "credit",  amount: 750,  description: "Grocery items",       createdAt: daysAgo(20, 11) },
        { id: 202, type: "payment", amount: 300,  description: "Cash payment",         createdAt: daysAgo(15, 14) },
      ],
    },
    {
      id: 102, name: "Sunita Devi",  phone: "9845123456", address: "Shastri Chowk",  totalDue: 0,
      createdAt: daysAgo(40),
      transactions: [
        { id: 203, type: "credit",  amount: 520,  description: "Dal, Rice, Oil",       createdAt: daysAgo(30, 10) },
        { id: 204, type: "payment", amount: 520,  description: "Full payment UPI",     createdAt: daysAgo(28, 16) },
      ],
    },
    {
      id: 103, name: "Mohit Sharma", phone: "9912345678", address: "Ram Nagar",      totalDue: 1200,
      createdAt: daysAgo(38),
      transactions: [
        { id: 205, type: "credit",  amount: 850,  description: "Monthly kirana",       createdAt: daysAgo(25, 9)  },
        { id: 206, type: "credit",  amount: 620,  description: "Masala, Oil, Soap",    createdAt: daysAgo(10, 12) },
        { id: 207, type: "payment", amount: 270,  description: "Partial payment",      createdAt: daysAgo(5, 17)  },
      ],
    },
    {
      id: 104, name: "Priya Singh",  phone: "9867890123", address: "Nehru Colony",   totalDue: 0,
      createdAt: daysAgo(35),
      transactions: [
        { id: 208, type: "credit",  amount: 340,  description: "Biscuits, Snacks",     createdAt: daysAgo(14, 11) },
        { id: 209, type: "payment", amount: 340,  description: "Cash payment",         createdAt: daysAgo(12, 18) },
      ],
    },
    {
      id: 105, name: "Deepak Yadav", phone: "9834567890", address: "Civil Lines",    totalDue: 850,
      createdAt: daysAgo(30),
      transactions: [
        { id: 210, type: "credit",  amount: 1150, description: "Atta, Dal, Oil, Salt", createdAt: daysAgo(18, 10) },
        { id: 211, type: "payment", amount: 300,  description: "Cash payment",         createdAt: daysAgo(8,  15) },
      ],
    },
    {
      id: 106, name: "Anjali Gupta", phone: "9878901234", address: "Model Town",    totalDue: 320,
      createdAt: daysAgo(20),
      transactions: [
        { id: 212, type: "credit",  amount: 320,  description: "Dairy items, Maggi",  createdAt: daysAgo(7, 13)  },
      ],
    },
  ];

  // ── Bills (past 30 days + today) ──
  // Each entry: [daysBack, hour, items[], paymentMode, customerId?]
  type BillTemplate = {
    daysBack: number;
    hour: number;
    items: { productId: number; qty: number }[];
    mode: BillInputPaymentMode;
    customerId?: number;
    customerName?: string;
    discount?: number;
  };

  const billTemplates: BillTemplate[] = [
    // Today
    { daysBack: 0, hour: 9,  items: [{ productId: 1, qty: 2 }, { productId: 6, qty: 3 }],                       mode: "cash"  },
    { daysBack: 0, hour: 10, items: [{ productId: 10, qty: 5 }, { productId: 14, qty: 2 }],                      mode: "upi"   },
    { daysBack: 0, hour: 11, items: [{ productId: 2, qty: 1 }, { productId: 7, qty: 1 }, { productId: 1, qty: 1 }], mode: "cash", discount: 10 },
    { daysBack: 0, hour: 12, items: [{ productId: 9, qty: 1 }, { productId: 8, qty: 2 }],                        mode: "upi",  customerId: 102, customerName: "Sunita Devi" },
    { daysBack: 0, hour: 14, items: [{ productId: 13, qty: 1 }, { productId: 12, qty: 1 }],                      mode: "khata", customerId: 103, customerName: "Mohit Sharma" },
    { daysBack: 0, hour: 16, items: [{ productId: 17, qty: 4 }, { productId: 15, qty: 2 }],                      mode: "cash"  },
    // Yesterday
    { daysBack: 1, hour: 9,  items: [{ productId: 1, qty: 3 }, { productId: 5, qty: 1 }],                        mode: "cash"  },
    { daysBack: 1, hour: 11, items: [{ productId: 6, qty: 5 }, { productId: 14, qty: 3 }],                       mode: "upi"   },
    { daysBack: 1, hour: 13, items: [{ productId: 2, qty: 1 }, { productId: 18, qty: 1 }],                       mode: "cash", customerId: 101, customerName: "Ravi Kumar", discount: 20 },
    { daysBack: 1, hour: 15, items: [{ productId: 10, qty: 6 }, { productId: 16, qty: 1 }],                      mode: "upi"   },
    { daysBack: 1, hour: 17, items: [{ productId: 9, qty: 1 }, { productId: 7, qty: 1 }],                        mode: "cash"  },
    // Day 2
    { daysBack: 2, hour: 10, items: [{ productId: 3, qty: 2 }, { productId: 6, qty: 4 }],                        mode: "cash"  },
    { daysBack: 2, hour: 12, items: [{ productId: 13, qty: 1 }, { productId: 1, qty: 2 }],                       mode: "upi"   },
    { daysBack: 2, hour: 14, items: [{ productId: 11, qty: 2 }, { productId: 15, qty: 1 }],                      mode: "cash"  },
    { daysBack: 2, hour: 16, items: [{ productId: 2, qty: 1 }, { productId: 7, qty: 2 }],                        mode: "khata", customerId: 105, customerName: "Deepak Yadav" },
    // Day 3
    { daysBack: 3, hour: 9,  items: [{ productId: 10, qty: 8 }, { productId: 14, qty: 4 }],                      mode: "cash"  },
    { daysBack: 3, hour: 11, items: [{ productId: 5, qty: 1 }, { productId: 9, qty: 1 }],                        mode: "upi",  discount: 15 },
    { daysBack: 3, hour: 15, items: [{ productId: 17, qty: 3 }, { productId: 6, qty: 2 }],                       mode: "cash"  },
    // Day 4
    { daysBack: 4, hour: 10, items: [{ productId: 1, qty: 4 }, { productId: 12, qty: 1 }],                       mode: "upi"   },
    { daysBack: 4, hour: 13, items: [{ productId: 18, qty: 1 }, { productId: 3, qty: 1 }],                       mode: "cash"  },
    { daysBack: 4, hour: 16, items: [{ productId: 11, qty: 3 }, { productId: 14, qty: 2 }],                      mode: "upi"   },
    // Day 5
    { daysBack: 5, hour: 9,  items: [{ productId: 2, qty: 1 }, { productId: 1, qty: 2 }, { productId: 7, qty: 1 }], mode: "cash", discount: 5 },
    { daysBack: 5, hour: 12, items: [{ productId: 10, qty: 10 }, { productId: 6, qty: 3 }],                      mode: "upi"   },
    { daysBack: 5, hour: 17, items: [{ productId: 9, qty: 1 }, { productId: 16, qty: 1 }],                       mode: "cash", customerId: 106, customerName: "Anjali Gupta" },
    // Day 6
    { daysBack: 6, hour: 10, items: [{ productId: 13, qty: 1 }, { productId: 5, qty: 1 }],                       mode: "upi"   },
    { daysBack: 6, hour: 14, items: [{ productId: 17, qty: 5 }, { productId: 15, qty: 2 }],                      mode: "cash"  },
    // Day 7
    { daysBack: 7, hour: 9,  items: [{ productId: 1, qty: 3 }, { productId: 6, qty: 4 }, { productId: 10, qty: 2 }], mode: "cash" },
    { daysBack: 7, hour: 13, items: [{ productId: 2, qty: 1 }, { productId: 12, qty: 1 }],                       mode: "khata", customerId: 101, customerName: "Ravi Kumar" },
    { daysBack: 7, hour: 16, items: [{ productId: 9, qty: 2 }, { productId: 7, qty: 1 }],                        mode: "upi"   },
    // Day 8
    { daysBack: 8, hour: 10, items: [{ productId: 11, qty: 2 }, { productId: 14, qty: 5 }],                      mode: "cash"  },
    { daysBack: 8, hour: 15, items: [{ productId: 18, qty: 1 }, { productId: 1, qty: 2 }],                       mode: "upi"   },
    // Day 9
    { daysBack: 9, hour: 9,  items: [{ productId: 3, qty: 3 }, { productId: 16, qty: 1 }],                       mode: "cash"  },
    { daysBack: 9, hour: 12, items: [{ productId: 5, qty: 1 }, { productId: 6, qty: 5 }],                        mode: "upi", discount: 10  },
    { daysBack: 9, hour: 17, items: [{ productId: 13, qty: 1 }, { productId: 17, qty: 3 }],                      mode: "cash"  },
    // Day 10
    { daysBack: 10, hour: 10, items: [{ productId: 2, qty: 1 }, { productId: 7, qty: 2 }, { productId: 1, qty: 3 }], mode: "cash" },
    { daysBack: 10, hour: 14, items: [{ productId: 10, qty: 6 }, { productId: 14, qty: 4 }],                     mode: "upi"   },
    // Day 11
    { daysBack: 11, hour: 11, items: [{ productId: 9, qty: 1 }, { productId: 15, qty: 2 }],                      mode: "cash"  },
    { daysBack: 11, hour: 16, items: [{ productId: 12, qty: 2 }, { productId: 18, qty: 1 }],                     mode: "khata", customerId: 103, customerName: "Mohit Sharma" },
    // Day 12
    { daysBack: 12, hour: 9,  items: [{ productId: 1, qty: 5 }, { productId: 6, qty: 6 }],                       mode: "cash"  },
    { daysBack: 12, hour: 13, items: [{ productId: 11, qty: 3 }, { productId: 17, qty: 4 }],                     mode: "upi"   },
    { daysBack: 12, hour: 17, items: [{ productId: 5, qty: 1 }, { productId: 9, qty: 1 }],                       mode: "cash"  },
    // Day 13
    { daysBack: 13, hour: 10, items: [{ productId: 13, qty: 1 }, { productId: 3, qty: 2 }],                      mode: "upi"   },
    { daysBack: 13, hour: 15, items: [{ productId: 2, qty: 1 }, { productId: 7, qty: 1 }, { productId: 16, qty: 1 }], mode: "cash", discount: 20 },
    // Day 14
    { daysBack: 14, hour: 9,  items: [{ productId: 10, qty: 8 }, { productId: 6, qty: 4 }],                      mode: "cash"  },
    { daysBack: 14, hour: 12, items: [{ productId: 14, qty: 6 }, { productId: 15, qty: 3 }],                     mode: "upi"   },
    { daysBack: 14, hour: 16, items: [{ productId: 1, qty: 4 }, { productId: 12, qty: 1 }],                      mode: "cash"  },
    // Day 15–20 (lighter)
    { daysBack: 15, hour: 10, items: [{ productId: 2, qty: 1 }, { productId: 6, qty: 3 }],                       mode: "upi"   },
    { daysBack: 15, hour: 14, items: [{ productId: 9, qty: 1 }, { productId: 17, qty: 2 }],                      mode: "cash"  },
    { daysBack: 16, hour: 11, items: [{ productId: 13, qty: 1 }, { productId: 1, qty: 3 }],                      mode: "cash"  },
    { daysBack: 16, hour: 15, items: [{ productId: 11, qty: 4 }, { productId: 10, qty: 5 }],                     mode: "upi"   },
    { daysBack: 17, hour: 9,  items: [{ productId: 3, qty: 2 }, { productId: 7, qty: 1 }],                       mode: "cash"  },
    { daysBack: 17, hour: 13, items: [{ productId: 18, qty: 1 }, { productId: 15, qty: 2 }],                     mode: "khata", customerId: 105, customerName: "Deepak Yadav" },
    { daysBack: 18, hour: 10, items: [{ productId: 6, qty: 5 }, { productId: 14, qty: 3 }],                      mode: "upi"   },
    { daysBack: 18, hour: 16, items: [{ productId: 5, qty: 1 }, { productId: 1, qty: 2 }],                       mode: "cash"  },
    { daysBack: 19, hour: 11, items: [{ productId: 2, qty: 1 }, { productId: 16, qty: 1 }],                      mode: "cash"  },
    { daysBack: 19, hour: 15, items: [{ productId: 12, qty: 1 }, { productId: 9, qty: 1 }],                      mode: "upi"   },
    { daysBack: 20, hour: 10, items: [{ productId: 10, qty: 10 }, { productId: 17, qty: 4 }],                    mode: "cash"  },
    { daysBack: 20, hour: 14, items: [{ productId: 13, qty: 1 }, { productId: 7, qty: 2 }],                      mode: "upi"   },
    { daysBack: 21, hour: 9,  items: [{ productId: 1, qty: 6 }, { productId: 6, qty: 4 }],                       mode: "cash"  },
    { daysBack: 21, hour: 13, items: [{ productId: 11, qty: 2 }, { productId: 15, qty: 3 }],                     mode: "upi"   },
    { daysBack: 22, hour: 11, items: [{ productId: 3, qty: 3 }, { productId: 18, qty: 1 }],                      mode: "cash", discount: 15 },
    { daysBack: 22, hour: 16, items: [{ productId: 14, qty: 5 }, { productId: 10, qty: 4 }],                     mode: "upi"   },
    { daysBack: 23, hour: 10, items: [{ productId: 2, qty: 1 }, { productId: 5, qty: 1 }],                       mode: "cash"  },
    { daysBack: 23, hour: 15, items: [{ productId: 9, qty: 2 }, { productId: 7, qty: 1 }],                       mode: "upi"   },
    { daysBack: 24, hour: 9,  items: [{ productId: 1, qty: 4 }, { productId: 17, qty: 5 }],                      mode: "cash"  },
    { daysBack: 24, hour: 14, items: [{ productId: 13, qty: 1 }, { productId: 12, qty: 1 }],                     mode: "khata", customerId: 103, customerName: "Mohit Sharma" },
    { daysBack: 25, hour: 11, items: [{ productId: 6, qty: 6 }, { productId: 15, qty: 2 }],                      mode: "cash"  },
    { daysBack: 25, hour: 16, items: [{ productId: 16, qty: 1 }, { productId: 3, qty: 2 }],                      mode: "upi"   },
    { daysBack: 26, hour: 10, items: [{ productId: 10, qty: 7 }, { productId: 14, qty: 4 }],                     mode: "cash"  },
    { daysBack: 27, hour: 9,  items: [{ productId: 2, qty: 1 }, { productId: 1, qty: 3 }, { productId: 7, qty: 1 }], mode: "upi" },
    { daysBack: 28, hour: 11, items: [{ productId: 11, qty: 3 }, { productId: 9, qty: 1 }],                      mode: "cash"  },
    { daysBack: 28, hour: 15, items: [{ productId: 18, qty: 1 }, { productId: 5, qty: 1 }],                      mode: "upi"   },
    { daysBack: 29, hour: 10, items: [{ productId: 13, qty: 1 }, { productId: 17, qty: 3 }],                     mode: "cash"  },
    { daysBack: 29, hour: 14, items: [{ productId: 6, qty: 4 }, { productId: 14, qty: 3 }],                      mode: "upi"   },
  ];

  const productMap = new Map(products.map((p) => [p.id, p]));
  let billId = 300;

  const bills: Bill[] = billTemplates.map((t) => {
    const items: BillItem[] = t.items.map((i) => {
      const prod = productMap.get(i.productId)!;
      return {
        productId: i.productId,
        quantity: i.qty,
        unitPrice: prod.sellingPrice,
        totalPrice: prod.sellingPrice * i.qty,
      };
    });
    const totalAmount = items.reduce((s, i) => s + i.totalPrice, 0);
    const discountAmount = t.discount ?? 0;
    const finalAmount = totalAmount - discountAmount;
    return {
      id: billId++,
      customerId: t.customerId,
      customerName: t.customerName,
      items,
      totalAmount,
      discountAmount,
      finalAmount,
      paymentMode: t.mode,
      createdAt: daysAgo(t.daysBack, t.hour, Math.floor(Math.random() * 50)),
    };
  });

  // Sort bills newest first
  bills.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  setStore("kirana_products", products);
  setStore("kirana_customers", customers);
  setStore("kirana_bills", bills);
  setStore("kirana_purchases", []);
  localStorage.setItem("kirana_next_id", "600");
  localStorage.setItem("kirana_seeded_v2", "1");

  nextId = 600;
}

// Run seed on module load
try { seedData(); } catch {}

// ─── Query Keys ──────────────────────────────────────────────────────────────

export function getListProductsQueryKey(params?: { search?: string }) {
  return ["products", "list", params ?? {}] as const;
}

export function getGetDashboardSummaryQueryKey() {
  return ["dashboard", "summary"] as const;
}

export function getListPurchasesQueryKey() {
  return ["purchases", "list"] as const;
}

export function getListBillsQueryKey() {
  return ["bills", "list"] as const;
}

export function getListCustomersQueryKey() {
  return ["customers", "list"] as const;
}

export function getGetCustomerQueryKey(id: number) {
  return ["customers", "detail", id] as const;
}

export function getGetSalesReportQueryKey(params?: { period?: string; from?: string; to?: string }) {
  return ["reports", "sales", params ?? {}] as const;
}

export function getGetProfitReportQueryKey(params?: { from?: string; to?: string }) {
  return ["reports", "profit", params ?? {}] as const;
}

// ─── Product Hooks ────────────────────────────────────────────────────────────

function fetchProducts(params?: { search?: string }): Product[] {
  const all = getStore<Product[]>("kirana_products", []);
  if (!params?.search) return all;
  const s = params.search.toLowerCase();
  return all.filter(
    (p) =>
      p.name.toLowerCase().includes(s) ||
      (p.barcode ?? "").toLowerCase().includes(s) ||
      p.category.toLowerCase().includes(s)
  );
}

export function useListProducts(params?: { search?: string }) {
  return useQuery({
    queryKey: getListProductsQueryKey(params),
    queryFn: () => fetchProducts(params),
  });
}

export function useCreateProduct() {
  return useMutation({
    mutationFn: async ({ data }: { data: Omit<Product, "id" | "createdAt"> }) => {
      const products = getStore<Product[]>("kirana_products", []);
      const product: Product = { ...data, id: genId(), createdAt: new Date().toISOString() };
      setStore("kirana_products", [...products, product]);
      return product;
    },
  });
}

export function useUpdateProduct() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Omit<Product, "id" | "createdAt"> }) => {
      const products = getStore<Product[]>("kirana_products", []);
      const updated = products.map((p) => (p.id === id ? { ...p, ...data } : p));
      setStore("kirana_products", updated);
      return updated.find((p) => p.id === id)!;
    },
  });
}

export function useDeleteProduct() {
  return useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const products = getStore<Product[]>("kirana_products", []);
      setStore("kirana_products", products.filter((p) => p.id !== id));
    },
  });
}

// ─── Customer Hooks ───────────────────────────────────────────────────────────

function fetchCustomers(params?: { search?: string }): Customer[] {
  const all = getStore<CustomerDetail[]>("kirana_customers", []);
  const customers: Customer[] = all.map(({ transactions, ...c }) => c);
  if (!params?.search) return customers;
  const s = params.search.toLowerCase();
  return customers.filter(
    (c) => c.name.toLowerCase().includes(s) || c.phone.toLowerCase().includes(s)
  );
}

export function useListCustomers(params?: { search?: string }) {
  return useQuery({
    queryKey: getListCustomersQueryKey(),
    queryFn: () => fetchCustomers(params),
  });
}

export function useCreateCustomer() {
  return useMutation({
    mutationFn: async ({ data }: { data: { name: string; phone: string; address?: string } }) => {
      const customers = getStore<CustomerDetail[]>("kirana_customers", []);
      const customer: CustomerDetail = {
        ...data,
        id: genId(),
        totalDue: 0,
        transactions: [],
        createdAt: new Date().toISOString(),
      };
      setStore("kirana_customers", [...customers, customer]);
      return customer;
    },
  });
}

export function useDeleteCustomer() {
  return useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const customers = getStore<CustomerDetail[]>("kirana_customers", []);
      setStore("kirana_customers", customers.filter((c) => c.id !== id));
    },
  });
}

export function useGetCustomer(
  id: number,
  options?: { query?: Partial<UseQueryOptions<CustomerDetail | null>> }
) {
  return useQuery({
    queryKey: getGetCustomerQueryKey(id),
    queryFn: () => {
      const customers = getStore<CustomerDetail[]>("kirana_customers", []);
      return customers.find((c) => c.id === id) ?? null;
    },
    ...options?.query,
  });
}

export function useAddKhataTransaction() {
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: { type: "credit" | "payment"; amount: number; description: string };
    }) => {
      const customers = getStore<CustomerDetail[]>("kirana_customers", []);
      const updated = customers.map((c) => {
        if (c.id !== id) return c;
        const tx: KhataTransaction = { id: genId(), ...data, createdAt: new Date().toISOString() };
        const newDue =
          data.type === "credit" ? c.totalDue + data.amount : Math.max(0, c.totalDue - data.amount);
        return { ...c, totalDue: newDue, transactions: [...c.transactions, tx] };
      });
      setStore("kirana_customers", updated);
    },
  });
}

// ─── Bill Hooks ───────────────────────────────────────────────────────────────

export function useListBills() {
  return useQuery({
    queryKey: getListBillsQueryKey(),
    queryFn: () => getStore<Bill[]>("kirana_bills", []),
  });
}

export function useCreateBill() {
  return useMutation({
    mutationFn: async ({ data }: { data: BillInput }) => {
      const bills = getStore<Bill[]>("kirana_bills", []);
      const customers = getStore<CustomerDetail[]>("kirana_customers", []);

      let customerName: string | undefined;
      if (data.customerId) {
        customerName = customers.find((c) => c.id === data.customerId)?.name;
      }

      const bill: Bill = { ...data, id: genId(), customerName, createdAt: new Date().toISOString() };
      setStore("kirana_bills", [bill, ...bills]);

      const products = getStore<Product[]>("kirana_products", []);
      setStore(
        "kirana_products",
        products.map((p) => {
          const item = data.items.find((i) => i.productId === p.id);
          if (!item) return p;
          return { ...p, currentStock: Math.max(0, p.currentStock - item.quantity) };
        })
      );

      if (data.paymentMode === "khata" && data.customerId) {
        setStore(
          "kirana_customers",
          customers.map((c) => {
            if (c.id !== data.customerId) return c;
            const tx: KhataTransaction = {
              id: genId(),
              type: "credit",
              amount: data.finalAmount,
              description: `Bill #${bill.id}`,
              createdAt: bill.createdAt,
            };
            return { ...c, totalDue: c.totalDue + data.finalAmount, transactions: [...c.transactions, tx] };
          })
        );
      }

      return bill;
    },
  });
}

// ─── Purchase Hooks ───────────────────────────────────────────────────────────

export function useListPurchases() {
  return useQuery({
    queryKey: getListPurchasesQueryKey(),
    queryFn: () => getStore<Purchase[]>("kirana_purchases", []),
  });
}

export function useCreatePurchase() {
  return useMutation({
    mutationFn: async ({ data }: { data: PurchaseInput }) => {
      const purchases = getStore<Purchase[]>("kirana_purchases", []);
      const purchase: Purchase = { ...data, id: genId(), createdAt: new Date().toISOString() };
      setStore("kirana_purchases", [purchase, ...purchases]);

      const products = getStore<Product[]>("kirana_products", []);
      setStore(
        "kirana_products",
        products.map((p) => {
          const item = data.items.find((i) => i.productId === p.id);
          if (!item) return p;
          return { ...p, currentStock: p.currentStock + item.quantity };
        })
      );
      return purchase;
    },
  });
}

// ─── Dashboard Hook ───────────────────────────────────────────────────────────

export function useGetDashboardSummary() {
  return useQuery({
    queryKey: getGetDashboardSummaryQueryKey(),
    queryFn: (): DashboardSummary => {
      const bills = getStore<Bill[]>("kirana_bills", []);
      const products = getStore<Product[]>("kirana_products", []);
      const customers = getStore<CustomerDetail[]>("kirana_customers", []);

      const todayStr = new Date().toISOString().split("T")[0];
      const todayBills = bills.filter((b) => b.createdAt.startsWith(todayStr));

      const todaySale = todayBills.reduce((s, b) => s + b.finalAmount, 0);
      const todayOrderCount = todayBills.length;

      const productMap = new Map(products.map((p) => [p.id, p]));
      let todayProfit = 0;
      for (const bill of todayBills) {
        for (const item of bill.items) {
          const prod = productMap.get(item.productId);
          if (prod) todayProfit += (item.unitPrice - prod.purchasePrice) * item.quantity;
        }
        todayProfit -= bill.discountAmount ?? 0;
      }

      const pendingCustomers = customers.filter((c) => c.totalDue > 0);
      const lowStockProducts = products.filter((p) => p.currentStock <= p.lowStockThreshold);

      return {
        todaySale,
        todayProfit: Math.max(0, todayProfit),
        todayOrderCount,
        pendingKhataAmount: pendingCustomers.reduce((s, c) => s + c.totalDue, 0),
        pendingKhataCount: pendingCustomers.length,
        lowStockCount: lowStockProducts.length,
        outOfStockCount: products.filter((p) => p.currentStock === 0).length,
        recentBills: bills.slice(0, 10).map((b) => ({
          id: b.id,
          customerName: b.customerName,
          finalAmount: b.finalAmount,
          paymentMode: b.paymentMode,
          createdAt: b.createdAt,
        })),
        lowStockProducts: lowStockProducts.map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          currentStock: p.currentStock,
          lowStockThreshold: p.lowStockThreshold,
          unit: p.unit,
        })),
      };
    },
  });
}

// ─── Report Hooks ─────────────────────────────────────────────────────────────

type SalesReport = {
  totalSales: number;
  orderCount: number;
  data: { date: string; sales: number; orders: number }[];
};

type ProfitReport = {
  totalRevenue: number;
  totalProfit: number;
  profitMargin: number;
  data: { date: string; revenue: number; profit: number }[];
};

type KhataReport = {
  totalPending: number;
  customerCount: number;
  customers: { id: number; name: string; phone: string; totalDue: number }[];
};

export function useGetSalesReport(
  params: { period?: string; from?: string; to?: string },
  options?: { query?: Partial<UseQueryOptions<SalesReport>> }
) {
  return useQuery<SalesReport>({
    queryKey: getGetSalesReportQueryKey(params),
    queryFn: (): SalesReport => {
      const bills = getStore<Bill[]>("kirana_bills", []);
      const from = params.from ? new Date(params.from) : new Date(0);
      const toRaw = params.to ?? "";
      const to = toRaw.includes("T") ? new Date(toRaw) : new Date((toRaw || new Date().toISOString().split("T")[0]) + "T23:59:59");

      const filtered = bills.filter((b) => {
        const d = new Date(b.createdAt);
        return d >= from && d <= to;
      });

      const byDate = new Map<string, { sales: number; orders: number }>();
      for (const b of filtered) {
        const date = b.createdAt.split("T")[0];
        const cur = byDate.get(date) ?? { sales: 0, orders: 0 };
        byDate.set(date, { sales: cur.sales + b.finalAmount, orders: cur.orders + 1 });
      }

      return {
        totalSales: filtered.reduce((s, b) => s + b.finalAmount, 0),
        orderCount: filtered.length,
        data: Array.from(byDate.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([date, v]) => ({ date, ...v })),
      };
    },
    ...options?.query,
  });
}

export function useGetProfitReport(
  params: { from?: string; to?: string },
  options?: { query?: Partial<UseQueryOptions<ProfitReport>> }
) {
  return useQuery<ProfitReport>({
    queryKey: getGetProfitReportQueryKey(params),
    queryFn: (): ProfitReport => {
      const bills = getStore<Bill[]>("kirana_bills", []);
      const products = getStore<Product[]>("kirana_products", []);
      const productMap = new Map(products.map((p) => [p.id, p]));

      const from = params.from ? new Date(params.from) : new Date(0);
      const toRaw = params.to ?? "";
      const to = toRaw.includes("T") ? new Date(toRaw) : new Date((toRaw || new Date().toISOString().split("T")[0]) + "T23:59:59");

      const filtered = bills.filter((b) => {
        const d = new Date(b.createdAt);
        return d >= from && d <= to;
      });

      const byDate = new Map<string, { revenue: number; profit: number }>();
      let totalRevenue = 0;
      let totalProfit = 0;

      for (const b of filtered) {
        const date = b.createdAt.split("T")[0];
        const cur = byDate.get(date) ?? { revenue: 0, profit: 0 };
        let billProfit = 0;
        for (const item of b.items) {
          const prod = productMap.get(item.productId);
          if (prod) billProfit += (item.unitPrice - prod.purchasePrice) * item.quantity;
        }
        billProfit -= b.discountAmount ?? 0;
        byDate.set(date, { revenue: cur.revenue + b.finalAmount, profit: cur.profit + billProfit });
        totalRevenue += b.finalAmount;
        totalProfit += billProfit;
      }

      return {
        totalRevenue,
        totalProfit: Math.max(0, totalProfit),
        profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
        data: Array.from(byDate.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([date, v]) => ({ date, ...v })),
      };
    },
    ...options?.query,
  });
}

export function useGetPendingKhataReport() {
  return useQuery<KhataReport>({
    queryKey: ["reports", "khata"],
    queryFn: (): KhataReport => {
      const customers = getStore<CustomerDetail[]>("kirana_customers", []);
      const pending = customers.filter((c) => c.totalDue > 0);
      return {
        totalPending: pending.reduce((s, c) => s + c.totalDue, 0),
        customerCount: pending.length,
        customers: pending.sort((a, b) => b.totalDue - a.totalDue).map((c) => ({
          id: c.id, name: c.name, phone: c.phone, totalDue: c.totalDue,
        })),
      };
    },
  });
}

export function useGetLowStockReport() {
  return useQuery<Product[]>({
    queryKey: ["reports", "lowstock"],
    queryFn: () => {
      const products = getStore<Product[]>("kirana_products", []);
      return products.filter((p) => p.currentStock <= p.lowStockThreshold).sort((a, b) => a.currentStock - b.currentStock);
    },
  });
}
