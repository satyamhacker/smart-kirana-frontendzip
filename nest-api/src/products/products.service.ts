import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from '../db/db.service';

const SELECT_PRODUCT = `
  SELECT id, name, category, unit,
    buying_price as "buyingPrice",
    selling_price as "sellingPrice",
    current_stock as "currentStock",
    min_stock_level as "minStockLevel",
    barcode, is_active as "isActive",
    created_at as "createdAt"
  FROM products
`;

@Injectable()
export class ProductsService {
  constructor(private readonly db: DbService) {}

  async findAll(params: { search?: string; category?: string; lowStock?: boolean }) {
    let sql = SELECT_PRODUCT + ' WHERE 1=1';
    const args: unknown[] = [];
    let i = 1;

    if (params.search) {
      sql += ` AND (name ILIKE $${i} OR category ILIKE $${i})`;
      args.push(`%${params.search}%`);
      i++;
    }
    if (params.category) {
      sql += ` AND category = $${i}`;
      args.push(params.category);
      i++;
    }
    if (params.lowStock) {
      sql += ` AND current_stock <= min_stock_level`;
    }
    sql += ` ORDER BY name ASC`;

    return this.db.query(sql, args);
  }

  async findOne(id: number) {
    const row = await this.db.queryOne(SELECT_PRODUCT + ' WHERE id = $1', [id]);
    if (!row) throw new NotFoundException('Product not found');
    return row;
  }

  async create(data: any) {
    const { name, category, unit, buyingPrice, sellingPrice, currentStock, minStockLevel, barcode } = data;
    const rows = await this.db.query(
      `INSERT INTO products (name, category, unit, buying_price, selling_price, current_stock, min_stock_level, barcode)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id, name, category, unit,
         buying_price as "buyingPrice", selling_price as "sellingPrice",
         current_stock as "currentStock", min_stock_level as "minStockLevel",
         barcode, is_active as "isActive", created_at as "createdAt"`,
      [name, category || 'General', unit || 'piece', buyingPrice || 0,
       sellingPrice || 0, currentStock || 0, minStockLevel || 5, barcode || null],
    );
    return rows[0];
  }

  async update(id: number, data: any) {
    const { name, category, unit, buyingPrice, sellingPrice, currentStock, minStockLevel, barcode, isActive } = data;
    const row = await this.db.queryOne(
      `UPDATE products SET name=$1, category=$2, unit=$3, buying_price=$4, selling_price=$5,
       current_stock=$6, min_stock_level=$7, barcode=$8, is_active=$9
       WHERE id=$10
       RETURNING id, name, category, unit,
         buying_price as "buyingPrice", selling_price as "sellingPrice",
         current_stock as "currentStock", min_stock_level as "minStockLevel",
         barcode, is_active as "isActive", created_at as "createdAt"`,
      [name, category, unit, buyingPrice, sellingPrice, currentStock,
       minStockLevel, barcode || null, isActive ?? true, id],
    );
    if (!row) throw new NotFoundException('Product not found');
    return row;
  }

  async remove(id: number) {
    await this.db.query('DELETE FROM products WHERE id = $1', [id]);
    return { success: true };
  }
}
