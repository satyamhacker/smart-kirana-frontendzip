import { Injectable } from '@nestjs/common';
import { DbService } from '../db/db.service';

const DEFAULTS = {
  shopName: 'Smart Kirana Store',
  shopAddress: '',
  shopPhone: '',
  ownerName: '',
  gstNumber: '',
  gstEnabled: false,
  currency: '₹',
  lowStockThreshold: 5,
};

@Injectable()
export class SettingsService {
  constructor(private readonly db: DbService) {}

  async get() {
    const settings = await this.db.queryOne(
      `SELECT shop_name as "shopName", shop_address as "shopAddress",
       shop_phone as "shopPhone", owner_name as "ownerName",
       gst_number as "gstNumber", gst_enabled as "gstEnabled",
       currency, low_stock_threshold as "lowStockThreshold"
       FROM app_settings WHERE id = 1`,
    );
    return settings ?? DEFAULTS;
  }

  async update(data: {
    shopName?: string;
    shopAddress?: string;
    shopPhone?: string;
    ownerName?: string;
    gstNumber?: string;
    gstEnabled?: boolean;
    currency?: string;
    lowStockThreshold?: number;
  }) {
    await this.db.query(
      `INSERT INTO app_settings (id, shop_name, shop_address, shop_phone, owner_name, gst_number, gst_enabled, currency, low_stock_threshold, updated_at)
       VALUES (1,$1,$2,$3,$4,$5,$6,$7,$8,NOW())
       ON CONFLICT (id) DO UPDATE SET
         shop_name=$1, shop_address=$2, shop_phone=$3, owner_name=$4,
         gst_number=$5, gst_enabled=$6, currency=$7, low_stock_threshold=$8, updated_at=NOW()`,
      [data.shopName, data.shopAddress || null, data.shopPhone || null, data.ownerName || null,
       data.gstNumber || null, data.gstEnabled ?? false, data.currency || '₹', data.lowStockThreshold || 5],
    );
    return { success: true };
  }
}
