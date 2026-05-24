"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Store, Printer, FileText, MessageCircle, Save, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useGetSettings, useUpdateSettings } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { getSettingsQueryKey } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

type SettingsForm = {
  shopName: string;
  shopAddress: string;
  shopPhone: string;
  ownerName: string;
  gstNumber: string;
  gstEnabled: boolean;
  currency: string;
  lowStockThreshold: number;
  whatsappNumber: string;
  printerName: string;
};

const DEFAULTS: SettingsForm = {
  shopName: "Smart Kirana Store",
  shopAddress: "",
  shopPhone: "",
  ownerName: "",
  gstNumber: "",
  gstEnabled: false,
  currency: "₹",
  lowStockThreshold: 5,
  whatsappNumber: "",
  printerName: "",
};

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: serverSettings, isLoading } = useGetSettings();
  const updateSettings = useUpdateSettings();
  const [form, setForm] = useState<SettingsForm>(DEFAULTS);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (serverSettings) {
      setForm((prev) => ({
        ...DEFAULTS,
        ...prev,
        shopName: serverSettings.shopName ?? DEFAULTS.shopName,
        shopAddress: serverSettings.shopAddress ?? "",
        shopPhone: serverSettings.shopPhone ?? "",
        ownerName: serverSettings.ownerName ?? "",
        gstNumber: serverSettings.gstNumber ?? "",
        gstEnabled: serverSettings.gstEnabled ?? false,
        currency: serverSettings.currency ?? "₹",
        lowStockThreshold: serverSettings.lowStockThreshold ?? 5,
      }));
    }
  }, [serverSettings]);

  const update = (key: keyof SettingsForm, value: string | boolean | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const save = async () => {
    updateSettings.mutate(
      {
        data: {
          shopName: form.shopName,
          shopAddress: form.shopAddress || undefined,
          shopPhone: form.shopPhone || undefined,
          ownerName: form.ownerName || undefined,
          gstNumber: form.gstNumber || undefined,
          gstEnabled: form.gstEnabled,
          currency: form.currency,
          lowStockThreshold: form.lowStockThreshold,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Settings save ho gayi!" });
          queryClient.invalidateQueries({ queryKey: getSettingsQueryKey() });
          setIsDirty(false);
        },
        onError: () => toast({ title: "Settings save nahi hui", variant: "destructive" }),
      },
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-8 w-40" />
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6 space-y-4">
              {Array.from({ length: 3 }).map((_, j) => <Skeleton key={j} className="h-10 w-full" />)}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl" data-testid="page-settings">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings <span className="ml-2 text-base font-normal text-muted-foreground">(सेटिंग)</span></h1>
        <p className="text-sm text-muted-foreground mt-1">Apni dukaan ki details yahan set karein</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Store className="h-4 w-4 text-primary" /> Dukaan Details
          </CardTitle>
          <CardDescription>Aapki dukaan ki basic information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="shopName">Dukaan Ka Naam (Shop Name)</Label>
            <Input id="shopName" data-testid="input-shop-name" value={form.shopName} onChange={(e) => update("shopName", e.target.value)} placeholder="e.g. Ramesh General Store" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ownerName">Malik Ka Naam (Owner Name)</Label>
            <Input id="ownerName" data-testid="input-owner-name" value={form.ownerName} onChange={(e) => update("ownerName", e.target.value)} placeholder="e.g. Ramesh Kumar" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="shopAddress">Pata (Address)</Label>
            <Input id="shopAddress" data-testid="input-shop-address" value={form.shopAddress} onChange={(e) => update("shopAddress", e.target.value)} placeholder="e.g. Gandhi Nagar, Ward No. 5" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="shopPhone">Phone Number</Label>
            <Input id="shopPhone" data-testid="input-shop-phone" value={form.shopPhone} onChange={(e) => update("shopPhone", e.target.value)} placeholder="e.g. 9876543210" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-primary" /> GST Settings
          </CardTitle>
          <CardDescription>GST billing ke liye setup karein</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/40">
            <input
              type="checkbox" id="gstEnabled" data-testid="checkbox-gst-enabled"
              checked={form.gstEnabled} onChange={(e) => update("gstEnabled", e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            <Label htmlFor="gstEnabled" className="cursor-pointer font-medium">GST billing enable karein</Label>
          </div>
          {form.gstEnabled && (
            <div className="space-y-1.5">
              <Label htmlFor="gstNumber">GST Number (GSTIN)</Label>
              <Input id="gstNumber" data-testid="input-gst-number" value={form.gstNumber}
                onChange={(e) => update("gstNumber", e.target.value.toUpperCase())}
                placeholder="e.g. 22AAAAA0000A1Z5" className="font-mono" />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageCircle className="h-4 w-4 text-positive" /> WhatsApp Settings
          </CardTitle>
          <CardDescription>WhatsApp pe bill ya reminder bhejne ke liye</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
            <Input id="whatsappNumber" data-testid="input-whatsapp-number" value={form.whatsappNumber}
              onChange={(e) => update("whatsappNumber", e.target.value)} placeholder="e.g. 9876543210" />
          </div>
          <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
            Coming soon: Customer ko directly WhatsApp pe bill bheja jayega
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Printer className="h-4 w-4 text-primary" /> Printer Setup
          </CardTitle>
          <CardDescription>Thermal printer ya normal printer configure karein</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            <Label htmlFor="printerName">Printer Name / IP</Label>
            <Input id="printerName" data-testid="input-printer-name" value={form.printerName}
              onChange={(e) => update("printerName", e.target.value)} placeholder="e.g. Epson TM-T82, or 192.168.1.100" />
          </div>
          <p className="text-xs text-muted-foreground mt-2 bg-muted/50 rounded-lg px-3 py-2">
            Bill print karne ke liye browser ke default print option use karein (Ctrl+P)
          </p>
        </CardContent>
      </Card>

      <Separator />

      <Button
        size="lg" onClick={save} disabled={updateSettings.isPending || !isDirty}
        className="w-full sm:w-auto gap-2" data-testid="button-save-settings"
      >
        {updateSettings.isPending ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
        ) : (
          <><Save className="h-4 w-4" /> Settings Save Karein</>
        )}
      </Button>

      {!isDirty && !updateSettings.isPending && (
        <p className="text-xs text-muted-foreground text-center">All changes are saved to the database</p>
      )}
    </div>
  );
}
