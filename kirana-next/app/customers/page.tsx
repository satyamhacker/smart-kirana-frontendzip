"use client";

import { useState, useRef, useMemo } from "react";
import {
  useListCustomers,
  useCreateCustomer,
  useDeleteCustomer,
  useGetCustomer,
  useAddKhataTransaction,
  getListCustomersQueryKey,
  getGetCustomerQueryKey,
} from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, BookOpen, ArrowUpRight, ArrowDownRight, Users, Trash2, MessageCircle, Printer, IndianRupee, CreditCard, X, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const customerSchema = z.object({
  name: z.string().min(1, "Name required"),
  phone: z.string().min(10, "Phone required"),
  address: z.string().optional(),
});
type CustomerFormValues = z.infer<typeof customerSchema>;

const txSchema = z.object({
  type: z.enum(["credit", "payment"] as const),
  amount: z.coerce.number().min(0.01, "Amount must be > 0"),
  description: z.string().min(1, "Description required"),
});
type TxFormValues = z.infer<typeof txSchema>;

function KhataLedger({ customerId, onClose }: { customerId: number; onClose: () => void }) {
  const { data: detail, isLoading } = useGetCustomer(customerId, {
    query: { enabled: true, queryKey: getGetCustomerQueryKey(customerId) },
  });
  const addTx = useAddKhataTransaction();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [mode, setMode] = useState<"payment" | "credit" | null>(null);

  const form = useForm<TxFormValues>({
    resolver: zodResolver(txSchema),
    defaultValues: { type: "payment", amount: 0 as unknown as number, description: "" },
  });

  const setEntryMode = (m: "payment" | "credit") => {
    setMode(m);
    form.reset({ type: m, amount: 0 as unknown as number, description: "" });
  };

  const onSubmit = (values: TxFormValues) => {
    addTx.mutate(
      { id: customerId, data: values },
      {
        onSuccess: () => {
          toast({ title: values.type === "payment" ? "Payment record hua" : "Credit entry add hua" });
          queryClient.invalidateQueries({ queryKey: getGetCustomerQueryKey(customerId) });
          queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() });
          form.reset({ type: values.type, amount: 0 as unknown as number, description: "" });
          setMode(null);
        },
        onError: () => toast({ title: "Transaction nahi hua", variant: "destructive" }),
      }
    );
  };

  const ledgerRows = useMemo(() => {
    if (!detail?.transactions) return [];
    let balance = 0;
    return detail.transactions.map((tx) => {
      balance += tx.type === "credit" ? tx.amount : -tx.amount;
      return { ...tx, balance };
    });
  }, [detail?.transactions]);

  const shopName = (() => {
    try {
      const s = typeof window !== "undefined" ? localStorage.getItem("kirana_settings") : null;
      if (s) return JSON.parse(s).shopName || "Smart Kirana Store";
    } catch {}
    return "Smart Kirana Store";
  })();

  const handleWhatsApp = () => {
    if (!detail) return;
    const phone = detail.phone.replace(/\D/g, "");
    const due = detail.totalDue.toFixed(2);
    const msg = encodeURIComponent(`Namaste ${detail.name} Ji,\n\nAapka balance ₹${due} pending hai.\n\nKripya payment kare.\n\n${shopName}`);
    window.open(`https://wa.me/91${phone}?text=${msg}`, "_blank");
  };

  const handlePrint = () => {
    if (!detail) return;
    const win = window.open("", "_blank", "width=700,height=900");
    if (!win) return;
    const rows = ledgerRows.map((tx) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#555;font-size:13px">${format(new Date(tx.createdAt), "dd MMM yyyy")}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px">${tx.description}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;font-size:13px;color:${tx.type === "credit" ? "#b45309" : "#15803d"}">${tx.type === "credit" ? "+" : "-"} ₹${tx.amount.toFixed(2)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;font-weight:600;font-size:13px;color:${tx.balance > 0 ? "#b45309" : "#15803d"}">₹${tx.balance.toFixed(2)}</td>
      </tr>`).join("");
    win.document.write(`<html><head><title>Khata Statement - ${detail.name}</title>
      <style>body{font-family:system-ui,sans-serif;margin:0;padding:24px;color:#111}h2{margin:0 0 4px}p{margin:0 0 2px;color:#555;font-size:13px}
      table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#f1f5f9;padding:10px 12px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:#64748b}
      .due{font-size:20px;font-weight:700;color:#b45309}.footer{margin-top:24px;font-size:12px;color:#94a3b8;border-top:1px solid #eee;padding-top:12px}
      </style></head><body>
      <h2>${shopName}</h2><p>Khata Statement</p>
      <hr style="margin:12px 0;border:none;border-top:2px solid #0d9488"/>
      <h3 style="margin:0 0 4px">${detail.name}</h3>
      <p>📞 ${detail.phone}${detail.address ? " · " + detail.address : ""}</p>
      <p style="margin-top:8px">Total Due: <span class="due">₹${detail.totalDue.toFixed(2)}</span></p>
      <table><thead><tr><th>Date</th><th>Description</th><th style="text-align:right">Amount</th><th style="text-align:right">Balance</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <div class="footer">Printed on ${format(new Date(), "dd MMM yyyy, hh:mm a")} · ${shopName}</div>
      </body></html>`);
    win.document.close();
    win.print();
  };

  if (isLoading) {
    return (
      <div className="space-y-3 py-6">
        <Skeleton className="h-20 w-full rounded-xl" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }
  if (!detail) return null;

  return (
    <div className="flex flex-col gap-0" style={{ maxHeight: "80vh" }}>
      <div className="rounded-xl border bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 p-4 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-extrabold text-lg">
              {detail.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-base">{detail.name}</p>
              <p className="text-sm text-muted-foreground">📞 {detail.phone}</p>
              {detail.address && <p className="text-xs text-muted-foreground">{detail.address}</p>}
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Due</p>
          <p className={cn("text-3xl font-extrabold", detail.totalDue > 0 ? "text-warning" : "text-positive")}>
            ₹{detail.totalDue.toFixed(2)}
          </p>
          {detail.totalDue > 0 && <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] mt-1">Pending</Badge>}
          {detail.totalDue === 0 && <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px] mt-1">Clear</Badge>}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <Button size="sm" className="gap-1.5 bg-positive hover:bg-green-700 text-white" onClick={() => setEntryMode("payment")} data-testid="button-add-payment">
          <IndianRupee className="h-3.5 w-3.5" /> Payment Mila
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5 border-warning text-warning hover:bg-amber-50" onClick={() => setEntryMode("credit")} data-testid="button-add-credit">
          <CreditCard className="h-3.5 w-3.5" /> Udhaar Diya
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5 border-green-400 text-green-700 hover:bg-green-50" onClick={handleWhatsApp} data-testid="button-whatsapp">
          <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={handlePrint} data-testid="button-print-statement">
          <Printer className="h-3.5 w-3.5" /> Statement
        </Button>
      </div>

      {mode && (
        <div className={cn("rounded-xl border p-4 mb-4 space-y-3", mode === "payment" ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200")}>
          <div className="flex items-center justify-between">
            <p className="font-semibold text-sm">{mode === "payment" ? "💰 Payment Entry" : "📦 Credit / Udhaar Entry"}</p>
            <button onClick={() => setMode(null)}><X className="h-4 w-4 text-muted-foreground hover:text-foreground" /></button>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-wrap gap-3 items-end">
              <FormField control={form.control} name="amount" render={({ field }) => (
                <FormItem className="flex-1 min-w-[120px]">
                  <FormLabel className="text-xs">Amount (₹)</FormLabel>
                  <FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} className="h-9" data-testid="input-tx-amount" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem className="flex-[2] min-w-[160px]">
                  <FormLabel className="text-xs">{mode === "payment" ? "Note (optional)" : "Saman / Item name"}</FormLabel>
                  <FormControl><Input placeholder={mode === "payment" ? "e.g. Cash payment" : "e.g. Rice, Toor Dal"} {...field} className="h-9" data-testid="input-tx-description" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" size="sm" className={cn("h-9", mode === "payment" ? "bg-positive hover:bg-green-700" : "bg-warning hover:bg-amber-600")} disabled={addTx.isPending} data-testid="button-save-tx">
                {addTx.isPending ? "..." : mode === "payment" ? "Record Payment" : "Add Udhaar"}
              </Button>
            </form>
          </Form>
        </div>
      )}

      <div className="flex-1 overflow-auto rounded-xl border">
        <div className="grid grid-cols-[1fr_2fr_auto_auto] gap-0 bg-muted/60 border-b">
          <div className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Date</div>
          <div className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Description</div>
          <div className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground text-right">Amount</div>
          <div className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground text-right">Balance</div>
        </div>

        {ledgerRows.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Koi transaction nahi abhi tak</p>
          </div>
        ) : (
          <div className="divide-y">
            {ledgerRows.map((tx) => (
              <div key={tx.id} className="grid grid-cols-[1fr_2fr_auto_auto] gap-0 hover:bg-muted/20 transition-colors" data-testid={`row-tx-${tx.id}`}>
                <div className="px-4 py-3">
                  <p className="text-xs text-muted-foreground whitespace-nowrap">{format(new Date(tx.createdAt), "dd MMM")}</p>
                  <p className="text-[10px] text-muted-foreground/60">{format(new Date(tx.createdAt), "yyyy")}</p>
                </div>
                <div className="px-4 py-3 flex items-start gap-2 min-w-0">
                  <div className={cn("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full", tx.type === "credit" ? "bg-amber-100 text-warning" : "bg-green-100 text-positive")}>
                    {tx.type === "credit" ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-tight break-words">{tx.description}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{tx.type === "credit" ? "Udhaar / Credit" : "Payment Received"}</p>
                  </div>
                </div>
                <div className="px-4 py-3 text-right whitespace-nowrap">
                  <p className={cn("font-semibold text-sm", tx.type === "credit" ? "text-warning" : "text-positive")}>
                    {tx.type === "credit" ? "+" : "-"} ₹{tx.amount.toFixed(0)}
                  </p>
                </div>
                <div className="px-4 py-3 text-right whitespace-nowrap">
                  <p className={cn("font-bold text-sm", tx.balance > 0 ? "text-warning" : "text-positive")}>
                    ₹{tx.balance.toFixed(0)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {ledgerRows.length > 0 && (
          <div className="grid grid-cols-[1fr_2fr_auto_auto] border-t bg-muted/40">
            <div className="px-4 py-3 col-span-3 text-sm font-bold text-foreground">Total Balance Due</div>
            <div className="px-4 py-3 text-right">
              <span className={cn("text-base font-extrabold", detail.totalDue > 0 ? "text-warning" : "text-positive")}>
                ₹{detail.totalDue.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>

      {detail.totalDue > 0 && (
        <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-green-800 flex items-center gap-1.5">
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp Reminder Preview
            </p>
            <Button size="sm" className="h-7 px-3 text-xs bg-green-600 hover:bg-green-700 text-white" onClick={handleWhatsApp}>Send Now</Button>
          </div>
          <div className="bg-white rounded-lg border border-green-200 p-3 text-xs text-gray-700 whitespace-pre-line leading-relaxed font-mono">
            {`Namaste ${detail.name} Ji,\n\nAapka balance ₹${detail.totalDue.toFixed(2)} pending hai.\n\nKripya payment kare.\n\n${shopName}`}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Customers() {
  const [search, setSearch] = useState("");
  const { data: customers = [], isLoading } = useListCustomers({ search: search || undefined });
  const createCustomer = useCreateCustomer();
  const deleteCustomer = useDeleteCustomer();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [ledgerId, setLedgerId] = useState<number | null>(null);

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: { name: "", phone: "", address: "" },
  });

  const onAdd = (values: CustomerFormValues) => {
    createCustomer.mutate(
      { data: values },
      {
        onSuccess: () => {
          toast({ title: "Customer add hua" });
          queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() });
          setIsAddOpen(false);
          form.reset();
        },
        onError: () => toast({ title: "Customer add nahi hua", variant: "destructive" }),
      }
    );
  };

  const onDelete = (id: number, name: string) => {
    if (!confirm(`"${name}" delete karna chahte hain?`)) return;
    deleteCustomer.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Customer delete hua" });
          queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() });
        },
        onError: () => toast({ title: "Delete nahi hua", variant: "destructive" }),
      }
    );
  };

  const totalDue = customers.reduce((sum, c) => sum + c.totalDue, 0);
  const customersWithDue = customers.filter((c) => c.totalDue > 0).length;

  return (
    <div className="space-y-5" data-testid="page-customers">
      <div className="flex flex-wrap justify-between items-start gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Khata <span className="ml-2 text-base font-normal text-muted-foreground">(खाता / Customers)</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {customers.length} customers ·{" "}
            {customersWithDue > 0 ? (
              <span className="text-warning font-semibold">{customersWithDue} ka ₹{totalDue.toFixed(0)} pending</span>
            ) : (
              <span className="text-positive font-semibold">Sab clear hai</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Naam ya phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-52" data-testid="input-search-customers" />
          </div>
          <Button onClick={() => setIsAddOpen(true)} data-testid="button-add-customer">
            <Plus className="mr-1.5 h-4 w-4" /> Add Customer
          </Button>
        </div>
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Naya Customer Add Karein</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onAdd)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Naam (Name)</FormLabel>
                  <FormControl><Input {...field} placeholder="e.g. Ravi Kumar" data-testid="input-customer-name" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl><Input {...field} placeholder="e.g. 9876543210" data-testid="input-customer-phone" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem>
                  <FormLabel>Address (optional)</FormLabel>
                  <FormControl><Input {...field} placeholder="e.g. Main Road" data-testid="input-customer-address" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" className="w-full" disabled={createCustomer.isPending} data-testid="button-save-customer">
                {createCustomer.isPending ? "Adding..." : "Customer Add Karein"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={ledgerId !== null} onOpenChange={(open) => !open && setLedgerId(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Khata Ledger</DialogTitle>
          </DialogHeader>
          {ledgerId !== null && <KhataLedger customerId={ledgerId} onClose={() => setLedgerId(null)} />}
        </DialogContent>
      </Dialog>

      <div className="rounded-xl border bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Users className="h-10 w-10 mb-3 opacity-20" />
            <p className="text-sm">Koi customer nahi. Upar se add karein.</p>
          </div>
        ) : (
          <div className="divide-y">
            {customers.map((customer) => (
              <div
                key={customer.id}
                className="flex items-center justify-between px-5 py-4 hover:bg-muted/20 transition-colors cursor-pointer"
                onClick={() => setLedgerId(customer.id)}
                data-testid={`row-customer-${customer.id}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{customer.name}</p>
                    <p className="text-xs text-muted-foreground">📞 {customer.phone}</p>
                    {customer.address && <p className="text-xs text-muted-foreground truncate">{customer.address}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    {customer.totalDue > 0 ? (
                      <>
                        <p className="font-bold text-warning text-sm">₹{customer.totalDue.toFixed(0)}</p>
                        <p className="text-[10px] text-muted-foreground">Pending</p>
                      </>
                    ) : (
                      <p className="text-[10px] text-positive font-semibold">Clear</p>
                    )}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(customer.id, customer.name); }}
                    className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-red-50 transition-colors"
                    data-testid={`button-delete-customer-${customer.id}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
