import { useState } from "react";
import { useListPurchases, useCreatePurchase, useListProducts, getListPurchasesQueryKey, getListProductsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Search, Truck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PurchaseInput, PurchaseItemInput } from "@workspace/api-client-react";

const purchaseItemSchema = z.object({
  productId: z.coerce.number().min(1, "Product is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  unitCost: z.coerce.number().min(0, "Unit cost must be >= 0"),
});

const purchaseSchema = z.object({
  supplierName: z.string().min(1, "Supplier name is required"),
  notes: z.string().optional(),
});

type PurchaseFormValues = z.infer<typeof purchaseSchema>;

export default function Purchases() {
  const { data: purchases = [], isLoading } = useListPurchases();
  const { data: products = [] } = useListProducts();
  const createPurchase = useCreatePurchase();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [items, setItems] = useState<z.infer<typeof purchaseItemSchema>[]>([]);

  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      supplierName: "",
      notes: "",
    }
  });

  const addItemForm = useForm<z.infer<typeof purchaseItemSchema>>({
    resolver: zodResolver(purchaseItemSchema),
    defaultValues: {
      productId: 0,
      quantity: 1,
      unitCost: 0,
    }
  });

  const onAddItem = (values: z.infer<typeof purchaseItemSchema>) => {
    setItems([...items, values]);
    addItemForm.reset({ productId: 0, quantity: 1, unitCost: 0 });
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);

  const onSubmit = (values: PurchaseFormValues) => {
    if (items.length === 0) {
      toast({ title: "Add at least one item", variant: "destructive" });
      return;
    }

    const payload: PurchaseInput = {
      supplierName: values.supplierName,
      notes: values.notes,
      totalAmount,
      items: items.map(item => ({
        ...item,
        totalCost: item.quantity * item.unitCost
      }))
    };

    createPurchase.mutate({ data: payload }, {
      onSuccess: () => {
        toast({ title: "Purchase recorded successfully" });
        queryClient.invalidateQueries({ queryKey: getListPurchasesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        setIsAddOpen(false);
        form.reset();
        setItems([]);
      },
      onError: () => toast({ title: "Failed to record purchase", variant: "destructive" })
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Purchase History</h1>
        <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if(!open) { form.reset(); setItems([]); }}}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> New Purchase</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Record New Purchase</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <Form {...form}>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="supplierName" render={({ field }) => (
                    <FormItem><FormLabel>Supplier Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="notes" render={({ field }) => (
                    <FormItem><FormLabel>Notes / Invoice No</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              </Form>

              <div className="border rounded-md p-4 bg-muted/20 space-y-4">
                <h4 className="font-semibold text-sm">Add Item to Bill</h4>
                <Form {...addItemForm}>
                  <form onSubmit={addItemForm.handleSubmit(onAddItem)} className="flex items-end gap-2">
                    <FormField control={addItemForm.control} name="productId" render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Product</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ? field.value.toString() : undefined}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {products.map(p => (
                              <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <FormField control={addItemForm.control} name="quantity" render={({ field }) => (
                      <FormItem className="w-24">
                        <FormLabel>Qty</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={addItemForm.control} name="unitCost" render={({ field }) => (
                      <FormItem className="w-32">
                        <FormLabel>Unit Cost (₹)</FormLabel>
                        <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                      </FormItem>
                    )} />
                    <Button type="submit" variant="secondary">Add</Button>
                  </form>
                </Form>
              </div>

              {items.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Purchase Items</h4>
                  <div className="border rounded-md divide-y">
                    {items.map((item, index) => {
                      const prod = products.find(p => p.id === item.productId);
                      return (
                        <div key={index} className="flex justify-between items-center p-3 text-sm">
                          <div className="flex-1">
                            <span className="font-medium">{prod?.name || "Unknown"}</span>
                            <div className="text-muted-foreground text-xs">{item.quantity} x ₹{item.unitCost}</div>
                          </div>
                          <div className="font-semibold mr-4">₹{(item.quantity * item.unitCost).toFixed(2)}</div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeItem(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )
                    })}
                    <div className="p-3 bg-muted/30 flex justify-between font-bold">
                      <span>Total Amount</span>
                      <span className="text-primary mr-12">₹{totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              <Button className="w-full" onClick={form.handleSubmit(onSubmit)} disabled={createPurchase.isPending}>
                {createPurchase.isPending ? 'Processing...' : 'Save Purchase Bill'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Date</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">Loading purchases...</TableCell></TableRow>
            ) : purchases.map((purchase) => (
              <TableRow key={purchase.id}>
                <TableCell className="text-muted-foreground">
                  {format(new Date(purchase.createdAt), "dd MMM yyyy, hh:mm a")}
                </TableCell>
                <TableCell>
                  <div className="font-medium flex items-center gap-2">
                    <Truck className="h-4 w-4 text-primary" />
                    {purchase.supplierName}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{purchase.notes || "-"}</TableCell>
                <TableCell className="text-right font-bold text-foreground">₹{purchase.totalAmount.toFixed(2)}</TableCell>
              </TableRow>
            ))}
            {purchases.length === 0 && !isLoading && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                  No purchases recorded yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
