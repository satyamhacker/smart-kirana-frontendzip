"use client";

import { useState } from "react";
import {
  useListProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  getListProductsQueryKey,
  getGetDashboardSummaryQueryKey,
  type Product,
} from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Edit, Trash2, Package } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const productSchema = z.object({
  name: z.string().min(1, "Name required"),
  barcode: z.string().optional(),
  category: z.string().min(1, "Category required"),
  purchasePrice: z.coerce.number().min(0),
  sellingPrice: z.coerce.number().min(0),
  currentStock: z.coerce.number().min(0),
  lowStockThreshold: z.coerce.number().min(0),
  unit: z.string().min(1, "Unit required"),
});
type ProductFormValues = z.infer<typeof productSchema>;

const UNITS = [
  { value: "pcs", label: "Pieces (pcs)" },
  { value: "kg", label: "Kilogram (kg)" },
  { value: "g", label: "Gram (g)" },
  { value: "l", label: "Liter (l)" },
  { value: "ml", label: "Milliliter (ml)" },
  { value: "pkt", label: "Packet (pkt)" },
  { value: "box", label: "Box" },
  { value: "dozen", label: "Dozen" },
  { value: "piece", label: "Piece" },
  { value: "bag", label: "Bag" },
  { value: "bottle", label: "Bottle" },
  { value: "pouch", label: "Pouch" },
  { value: "tube", label: "Tube" },
  { value: "packet", label: "Packet" },
];

function ProductForm({
  onSubmit, isPending, defaultValues, submitLabel,
}: {
  onSubmit: (v: ProductFormValues) => void;
  isPending: boolean;
  defaultValues: ProductFormValues;
  submitLabel: string;
}) {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem className="col-span-2">
              <FormLabel>Product Name</FormLabel>
              <FormControl><Input {...field} placeholder="e.g. Tata Salt 1kg" data-testid="input-product-name" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="category" render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <FormControl><Input {...field} placeholder="e.g. Grocery" data-testid="input-category" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="barcode" render={({ field }) => (
            <FormItem>
              <FormLabel>Barcode (optional)</FormLabel>
              <FormControl><Input {...field} placeholder="e.g. 890123..." data-testid="input-barcode" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="purchasePrice" render={({ field }) => (
            <FormItem>
              <FormLabel>Purchase Price (₹)</FormLabel>
              <FormControl><Input type="number" step="0.01" {...field} data-testid="input-purchase-price" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="sellingPrice" render={({ field }) => (
            <FormItem>
              <FormLabel>Selling Price (₹)</FormLabel>
              <FormControl><Input type="number" step="0.01" {...field} data-testid="input-selling-price" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="currentStock" render={({ field }) => (
            <FormItem>
              <FormLabel>Current Stock</FormLabel>
              <FormControl><Input type="number" {...field} data-testid="input-stock" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="lowStockThreshold" render={({ field }) => (
            <FormItem>
              <FormLabel>Alert at (Low Stock)</FormLabel>
              <FormControl><Input type="number" {...field} data-testid="input-low-stock-threshold" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="unit" render={({ field }) => (
            <FormItem className="col-span-2">
              <FormLabel>Unit</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-unit"><SelectValue placeholder="Select unit" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {UNITS.map((u) => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <Button type="submit" className="w-full" disabled={isPending} data-testid="button-save-product">
          {isPending ? "Saving..." : submitLabel}
        </Button>
      </form>
    </Form>
  );
}

export default function Products() {
  const [search, setSearch] = useState("");
  const { data: products = [], isLoading } = useListProducts({ search: search || undefined });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
  };

  const defaultAdd: ProductFormValues = {
    name: "", barcode: "", category: "", purchasePrice: 0,
    sellingPrice: 0, currentStock: 0, lowStockThreshold: 5, unit: "pcs",
  };

  const handleAdd = (values: ProductFormValues) => {
    createProduct.mutate(
      { data: values },
      {
        onSuccess: () => { toast({ title: "Product add hua" }); invalidate(); setIsAddOpen(false); },
        onError: () => toast({ title: "Product add nahi hua", variant: "destructive" }),
      }
    );
  };

  const handleEdit = (values: ProductFormValues) => {
    if (!editingProduct) return;
    updateProduct.mutate(
      { id: editingProduct.id, data: values },
      {
        onSuccess: () => { toast({ title: "Product update hua" }); invalidate(); setEditingProduct(null); },
        onError: () => toast({ title: "Update nahi hua", variant: "destructive" }),
      }
    );
  };

  const handleDelete = (id: number, name: string) => {
    if (!confirm(`"${name}" delete karna chahte hain?`)) return;
    deleteProduct.mutate(
      { id },
      {
        onSuccess: () => { toast({ title: "Product delete hua" }); invalidate(); },
        onError: () => toast({ title: "Delete nahi hua", variant: "destructive" }),
      }
    );
  };

  const getStockBadge = (product: Product) => {
    if (product.currentStock === 0) {
      return <Badge className="bg-red-100 text-red-700 border border-red-200 font-normal">Out of Stock</Badge>;
    }
    if (product.currentStock <= product.lowStockThreshold) {
      return <Badge className="bg-amber-100 text-amber-700 border border-amber-200 font-normal">Low Stock</Badge>;
    }
    return <Badge className="bg-green-100 text-green-700 border border-green-200 font-normal">In Stock</Badge>;
  };

  return (
    <div className="space-y-5" data-testid="page-products">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Stock <span className="ml-2 text-base font-normal text-muted-foreground">(स्टॉक)</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">{products.length} products · Inventory manage karein</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Product dhundein..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-52" data-testid="input-search-products" />
          </div>
          <Button onClick={() => setIsAddOpen(true)} data-testid="button-add-product">
            <Plus className="mr-1.5 h-4 w-4" /> Add Product
          </Button>
        </div>
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Naya Product Add Karein</DialogTitle></DialogHeader>
          <ProductForm onSubmit={handleAdd} isPending={createProduct.isPending} defaultValues={defaultAdd} submitLabel="Product Save Karein" />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Product Edit Karein</DialogTitle></DialogHeader>
          {editingProduct && (
            <ProductForm
              onSubmit={handleEdit}
              isPending={updateProduct.isPending}
              defaultValues={{
                name: editingProduct.name,
                barcode: editingProduct.barcode || "",
                category: editingProduct.category,
                purchasePrice: editingProduct.purchasePrice,
                sellingPrice: editingProduct.sellingPrice,
                currentStock: editingProduct.currentStock,
                lowStockThreshold: editingProduct.lowStockThreshold,
                unit: editingProduct.unit,
              }}
              submitLabel="Update Karein"
            />
          )}
        </DialogContent>
      </Dialog>

      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="font-semibold">Product</TableHead>
              <TableHead className="font-semibold">Stock</TableHead>
              <TableHead className="font-semibold">Kharida (₹)</TableHead>
              <TableHead className="font-semibold">Beecha (₹)</TableHead>
              <TableHead className="font-semibold">Margin</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="text-right font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                  <Package className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Koi product nahi. Upar se add karein.</p>
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => {
                const margin = product.sellingPrice > 0
                  ? (((product.sellingPrice - product.purchasePrice) / product.sellingPrice) * 100).toFixed(0)
                  : "0";
                return (
                  <TableRow
                    key={product.id}
                    data-testid={`row-product-${product.id}`}
                    className={cn(
                      product.currentStock === 0 && "bg-red-50/50",
                      product.currentStock > 0 && product.currentStock <= product.lowStockThreshold && "bg-amber-50/50"
                    )}
                  >
                    <TableCell>
                      <div className="font-semibold text-sm">{product.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {product.category}{product.barcode && ` · ${product.barcode}`}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "font-bold",
                        product.currentStock === 0 ? "text-destructive" : product.currentStock <= product.lowStockThreshold ? "text-warning" : "text-foreground"
                      )}>
                        {product.currentStock}
                      </span>{" "}
                      <span className="text-xs text-muted-foreground">{product.unit}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">₹{product.purchasePrice}</TableCell>
                    <TableCell className="font-semibold text-primary">₹{product.sellingPrice}</TableCell>
                    <TableCell><span className="text-xs font-medium text-positive">{margin}%</span></TableCell>
                    <TableCell>{getStockBadge(product)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingProduct(product)} data-testid={`button-edit-${product.id}`}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-red-50" onClick={() => handleDelete(product.id, product.name)} data-testid={`button-delete-${product.id}`}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
