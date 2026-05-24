import { Injectable } from '@nestjs/common';
import { DbService } from '../db/db.service';

@Injectable()
export class DashboardService {
  constructor(private readonly db: DbService) {}

  async getSummary() {
    const todayStr = new Date().toISOString().split('T')[0];

    const [todaySales, lowStockRows, recentBills] = await Promise.all([
      this.db.queryOne<{ revenue: string; profit: string; count: string }>(
        `SELECT COALESCE(SUM(b.total),0) as revenue,
         COALESCE(SUM(b.total - COALESCE(bi_cost.cost,0)),0) as profit,
         COUNT(*) as count
         FROM bills b
         LEFT JOIN (
           SELECT bill_id, SUM(buying_price * quantity) as cost FROM bill_items GROUP BY bill_id
         ) bi_cost ON bi_cost.bill_id = b.id
         WHERE DATE(b.created_at AT TIME ZONE 'Asia/Kolkata') = $1`,
        [todayStr],
      ),
      this.db.query(
        `SELECT id, name, category, unit, current_stock as "currentStock",
         min_stock_level as "lowStockThreshold"
         FROM products WHERE current_stock <= min_stock_level ORDER BY current_stock ASC LIMIT 10`,
      ),
      this.db.query(
        `SELECT b.id, b.customer_name as "customerName", b.total, b.payment_method as "paymentMode",
         b.created_at as "createdAt"
         FROM bills b ORDER BY b.created_at DESC LIMIT 6`,
      ),
    ]);

    const khataRows = await this.db.query<{ total: string; count: string }>(
      `SELECT COALESCE(SUM(CASE WHEN type='credit' THEN amount ELSE -amount END),0) as total,
       COUNT(DISTINCT customer_id) as count FROM khata_transactions`,
    );
    const khata = khataRows[0];
    const outOfStockCount = lowStockRows.filter((p: any) => p.currentStock === 0).length;

    return {
      todaySale: parseFloat(todaySales?.revenue ?? '0'),
      todayProfit: parseFloat(todaySales?.profit ?? '0'),
      todayOrderCount: parseInt(todaySales?.count ?? '0'),
      pendingKhataAmount: parseFloat(khata?.total ?? '0'),
      pendingKhataCount: parseInt(khata?.count ?? '0'),
      lowStockCount: lowStockRows.length,
      outOfStockCount,
      recentBills: recentBills.map((b: any) => ({
        id: b.id,
        customerName: b.customerName ?? null,
        finalAmount: parseFloat(b.total),
        paymentMode: b.paymentMode,
        createdAt: b.createdAt,
      })),
      lowStockProducts: lowStockRows.map((p: any) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        unit: p.unit,
        currentStock: p.currentStock,
        lowStockThreshold: p.lowStockThreshold,
      })),
    };
  }
}
