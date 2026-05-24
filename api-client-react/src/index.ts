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
      const updated = products.map((p) =>
        p.id === id ? { ...p, ...data } : p
      );
      setStore("kirana_products", updated);
      return updated.find((p) => p.id === id)!;
    },
  });
}

export function useDeleteProduct() {
  return useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const products = getStore<Product[]>("kirana_products", []);
      setStore(
        "kirana_products",
        products.filter((p) => p.id !== id)
      );
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
    (c) =>
      c.name.toLowerCase().includes(s) ||
      c.phone.toLowerCase().includes(s)
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
    mutationFn: async ({
      data,
    }: {
      data: { name: string; phone: string; address?: string };
    }) => {
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
      setStore(
        "kirana_customers",
        customers.filter((c) => c.id !== id)
      );
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
        const tx: KhataTransaction = {
          id: genId(),
          ...data,
          createdAt: new Date().toISOString(),
        };
        const newDue =
          data.type === "credit"
            ? c.totalDue + data.amount
            : Math.max(0, c.totalDue - data.amount);
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

      const bill: Bill = {
        ...data,
        id: genId(),
        customerName,
        createdAt: new Date().toISOString(),
      };

      setStore("kirana_bills", [bill, ...bills]);

      const products = getStore<Product[]>("kirana_products", []);
      const updatedProducts = products.map((p) => {
        const item = data.items.find((i) => i.productId === p.id);
        if (!item) return p;
        return { ...p, currentStock: Math.max(0, p.currentStock - item.quantity) };
      });
      setStore("kirana_products", updatedProducts);

      if (data.paymentMode === "khata" && data.customerId) {
        const updatedCustomers = customers.map((c) => {
          if (c.id !== data.customerId) return c;
          const tx: KhataTransaction = {
            id: genId(),
            type: "credit",
            amount: data.finalAmount,
            description: `Bill #${bill.id}`,
            createdAt: bill.createdAt,
          };
          return {
            ...c,
            totalDue: c.totalDue + data.finalAmount,
            transactions: [...c.transactions, tx],
          };
        });
        setStore("kirana_customers", updatedCustomers);
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
      const purchase: Purchase = {
        ...data,
        id: genId(),
        createdAt: new Date().toISOString(),
      };
      setStore("kirana_purchases", [purchase, ...purchases]);

      const products = getStore<Product[]>("kirana_products", []);
      const updatedProducts = products.map((p) => {
        const item = data.items.find((i) => i.productId === p.id);
        if (!item) return p;
        return { ...p, currentStock: p.currentStock + item.quantity };
      });
      setStore("kirana_products", updatedProducts);

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
          if (prod) {
            todayProfit += (item.unitPrice - prod.purchasePrice) * item.quantity;
          }
        }
      }
      if (todayBills.length > 0) {
        const totalDiscount = todayBills.reduce((s, b) => s + (b.discountAmount ?? 0), 0);
        todayProfit -= totalDiscount;
      }

      const pendingCustomers = customers.filter((c) => c.totalDue > 0);
      const pendingKhataAmount = pendingCustomers.reduce((s, c) => s + c.totalDue, 0);
      const pendingKhataCount = pendingCustomers.length;

      const lowStockProducts = products.filter(
        (p) => p.currentStock <= p.lowStockThreshold
      );
      const lowStockCount = lowStockProducts.length;
      const outOfStockCount = products.filter((p) => p.currentStock === 0).length;

      const recentBills = bills.slice(0, 10).map((b) => ({
        id: b.id,
        customerName: b.customerName,
        finalAmount: b.finalAmount,
        paymentMode: b.paymentMode,
        createdAt: b.createdAt,
      }));

      return {
        todaySale,
        todayProfit: Math.max(0, todayProfit),
        todayOrderCount,
        pendingKhataAmount,
        pendingKhataCount,
        lowStockCount,
        outOfStockCount,
        recentBills,
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
      const to = params.to ? new Date(params.to + "T23:59:59") : new Date();

      const filtered = bills.filter((b) => {
        const d = new Date(b.createdAt);
        return d >= from && d <= to;
      });

      const byDate = new Map<string, { sales: number; orders: number }>();
      for (const b of filtered) {
        const date = b.createdAt.split("T")[0];
        const cur = byDate.get(date) ?? { sales: 0, orders: 0 };
        byDate.set(date, {
          sales: cur.sales + b.finalAmount,
          orders: cur.orders + 1,
        });
      }

      const data = Array.from(byDate.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, v]) => ({ date, ...v }));

      return {
        totalSales: filtered.reduce((s, b) => s + b.finalAmount, 0),
        orderCount: filtered.length,
        data,
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
      const to = params.to ? new Date(params.to + "T23:59:59") : new Date();

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
          if (prod) {
            billProfit += (item.unitPrice - prod.purchasePrice) * item.quantity;
          }
        }
        billProfit -= b.discountAmount ?? 0;
        byDate.set(date, {
          revenue: cur.revenue + b.finalAmount,
          profit: cur.profit + billProfit,
        });
        totalRevenue += b.finalAmount;
        totalProfit += billProfit;
      }

      const data = Array.from(byDate.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, v]) => ({ date, ...v }));

      return {
        totalRevenue,
        totalProfit: Math.max(0, totalProfit),
        profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
        data,
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
        customers: pending
          .sort((a, b) => b.totalDue - a.totalDue)
          .map((c) => ({ id: c.id, name: c.name, phone: c.phone, totalDue: c.totalDue })),
      };
    },
  });
}

export function useGetLowStockReport() {
  return useQuery<Product[]>({
    queryKey: ["reports", "lowstock"],
    queryFn: () => {
      const products = getStore<Product[]>("kirana_products", []);
      return products
        .filter((p) => p.currentStock <= p.lowStockThreshold)
        .sort((a, b) => a.currentStock - b.currentStock);
    },
  });
}
