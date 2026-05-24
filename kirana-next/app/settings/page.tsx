"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Store, Printer, FileText, MessageCircle, Save } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const STORAGE_KEY = "kirana_settings";

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    shopName: "Smart Kirana Store",
    shopAddress: "",
    shopPhone: "",
    ownerName: "",
    gstNumber: "",
    gstEnabled: false,
    whatsappNumber: "",
    printerName: "",
    currency: "₹",
  };
}

export default function Settings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState(loadSettings);

  const update = (key: string, value: string | boolean) => {
    setSettings((prev: typeof settings) => ({ ...prev, [key]: value }));
  };

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    toast({ title: "Settings saved successfully" });
  };

  return (
    <div className="space-y-6 max-w-2xl" data-testid="page-settings">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings · सेटिंग</h1>
        <p className="text-sm text-muted-foreground mt-1">Apni dukaan ki details yahan set karein</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Store className="h-4 w-4 text-primary" />
            Dukaan Details
          </CardTitle>
          <CardDescription>Aapki dukaan ki basic information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="shopName">Dukaan Ka Naam (Shop Name)</Label>
            <Input
              id="shopName"
              data-testid="input-shop-name"
              value={settings.shopName}
              onChange={(e) => update("shopName", e.target.value)}
              placeholder="e.g. Ramesh General Store"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ownerName">Malik Ka Naam (Owner Name)</Label>
            <Input
              id="ownerName"
              data-testid="input-owner-name"
              value={settings.ownerName}
              onChange={(e) => update("ownerName", e.target.value)}
              placeholder="e.g. Ramesh Kumar"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="shopAddress">Pata (Address)</Label>
            <Input
              id="shopAddress"
              data-testid="input-shop-address"
              value={settings.shopAddress}
              onChange={(e) => update("shopAddress", e.target.value)}
              placeholder="e.g. Gandhi Nagar, Ward No. 5"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="shopPhone">Phone Number</Label>
            <Input
              id="shopPhone"
              data-testid="input-shop-phone"
              value={settings.shopPhone}
              onChange={(e) => update("shopPhone", e.target.value)}
              placeholder="e.g. 9876543210"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-primary" />
            GST Settings
          </CardTitle>
          <CardDescription>GST billing ke liye setup karein</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/40">
            <input
              type="checkbox"
              id="gstEnabled"
              data-testid="checkbox-gst-enabled"
              checked={settings.gstEnabled}
              onChange={(e) => update("gstEnabled", e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            <Label htmlFor="gstEnabled" className="cursor-pointer font-medium">
              GST billing enable karein
            </Label>
          </div>
          {settings.gstEnabled && (
            <div className="space-y-1.5">
              <Label htmlFor="gstNumber">GST Number (GSTIN)</Label>
              <Input
                id="gstNumber"
                data-testid="input-gst-number"
                value={settings.gstNumber}
                onChange={(e) => update("gstNumber", e.target.value.toUpperCase())}
                placeholder="e.g. 22AAAAA0000A1Z5"
                className="font-mono"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageCircle className="h-4 w-4 text-positive" />
            WhatsApp Settings
          </CardTitle>
          <CardDescription>WhatsApp pe bill ya reminder bhejne ke liye</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
            <Input
              id="whatsappNumber"
              data-testid="input-whatsapp-number"
              value={settings.whatsappNumber}
              onChange={(e) => update("whatsappNumber", e.target.value)}
              placeholder="e.g. 9876543210"
            />
          </div>
          <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
            Coming soon: Customer ko directly WhatsApp pe bill bheja jayega
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Printer className="h-4 w-4 text-primary" />
            Printer Setup
          </CardTitle>
          <CardDescription>Thermal printer ya normal printer configure karein</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            <Label htmlFor="printerName">Printer Name / IP</Label>
            <Input
              id="printerName"
              data-testid="input-printer-name"
              value={settings.printerName}
              onChange={(e) => update("printerName", e.target.value)}
              placeholder="e.g. Epson TM-T82, or 192.168.1.100"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2 bg-muted/50 rounded-lg px-3 py-2">
            Bill print karne ke liye browser ke default print option use karein (Ctrl+P)
          </p>
        </CardContent>
      </Card>

      <Separator />

      <Button size="lg" onClick={save} className="w-full sm:w-auto gap-2" data-testid="button-save-settings">
        <Save className="h-4 w-4" />
        Settings Save Karein
      </Button>
    </div>
  );
}
