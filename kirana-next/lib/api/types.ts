// ─── Shared Types ─────────────────────────────────────────────────────────────

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

export type SalesReport = {
  totalSales: number;
  orderCount: number;
  data: { date: string; sales: number; orders: number }[];
};

export type ProfitReport = {
  totalRevenue: number;
  totalProfit: number;
  profitMargin: number;
  data: { date: string; revenue: number; profit: number }[];
};

export type KhataReport = {
  totalPending: number;
  customerCount: number;
  customers: { id: number; name: string; phone: string; totalDue: number }[];
};

export type AppSettings = {
  shopName: string;
  shopAddress?: string;
  shopPhone?: string;
  ownerName?: string;
  gstNumber?: string;
  gstEnabled: boolean;
  currency: string;
  lowStockThreshold: number;
};
