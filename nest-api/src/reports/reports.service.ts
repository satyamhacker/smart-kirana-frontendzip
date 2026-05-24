import { Injectable } from '@nestjs/common';
import { DbService } from '../db/db.service';

@Injectable()
export class ReportsService {
  constructor(private readonly db: DbService) {}

  async getSales(from: string, to: string) {
    const rows = await this.db.query(
      `SELECT DATE(created_at) as date,
       COALESCE(SUM(total),0) as sales,
       COUNT(*) as bills
       FROM bills
       WHERE created_at >= $1 AND created_at <= $2
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [from, to],
    );

    const summary = await this.db.queryOne<{ total: string; count: string }>(
      `SELECT COALESCE(SUM(total),0) as total, COUNT(*) as count
       FROM bills WHERE created_at >= $1 AND created_at <= $2`,
      [from, to],
    );

    return {
      data: rows.map((r: any) => ({
        date: r.date,
        sales: parseFloat(r.sales),
        bills: parseInt(r.bills),
      })),
      totalSales: parseFloat(summary?.total ?? '0'),
      totalBills: parseInt(summary?.count ?? '0'),
    };
  }

  async getProfit(from: string, to: string) {
    const rows = await this.db.query(
      `SELECT DATE(b.created_at) as date,
       COALESCE(SUM(b.total),0) as revenue,
       COALESCE(SUM(b.total - COALESCE(bi_cost.cost,0)),0) as profit
       FROM bills b
       LEFT JOIN (
         SELECT bill_id, SUM(buying_price * quantity) as cost FROM bill_items GROUP BY bill_id
       ) bi_cost ON bi_cost.bill_id = b.id
       WHERE b.created_at >= $1 AND b.created_at <= $2
       GROUP BY DATE(b.created_at) ORDER BY date ASC`,
      [from, to],
    );

    const summary = await this.db.queryOne<{ revenue: string; cost: string }>(
      `SELECT COALESCE(SUM(b.total),0) as revenue,
       COALESCE(SUM(COALESCE(bi_cost.cost,0)),0) as cost
       FROM bills b
       LEFT JOIN (
         SELECT bill_id, SUM(buying_price * quantity) as cost FROM bill_items GROUP BY bill_id
       ) bi_cost ON bi_cost.bill_id = b.id
       WHERE b.created_at >= $1 AND b.created_at <= $2`,
      [from, to],
    );

    const totalRevenue = parseFloat(summary?.revenue ?? '0');
    const totalCost = parseFloat(summary?.cost ?? '0');
    const totalProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      data: rows.map((r: any) => ({
        date: r.date,
        revenue: parseFloat(r.revenue),
        profit: parseFloat(r.profit),
      })),
      totalRevenue,
      totalCost,
      totalProfit,
      profitMargin,
    };
  }

  async getKhata() {
    const customers = await this.db.query(
      `SELECT c.id, c.name, c.phone,
       COALESCE(SUM(CASE WHEN kt.type='credit' THEN kt.amount ELSE -kt.amount END),0) as "totalDue"
       FROM customers c
       LEFT JOIN khata_transactions kt ON kt.customer_id = c.id
       GROUP BY c.id
       HAVING COALESCE(SUM(CASE WHEN kt.type='credit' THEN kt.amount ELSE -kt.amount END),0) > 0
       ORDER BY "totalDue" DESC`,
    );

    const summary = await this.db.queryOne<{ total: string; count: string }>(
      `SELECT COALESCE(SUM(CASE WHEN type='credit' THEN amount ELSE -amount END),0) as total,
       COUNT(DISTINCT customer_id) as count FROM khata_transactions`,
    );

    return {
      customers: customers.map((c: any) => ({ ...c, totalDue: parseFloat(c.totalDue) })),
      totalPending: parseFloat(summary?.total ?? '0'),
      customerCount: parseInt(summary?.count ?? '0'),
    };
  }

  async getLowStock() {
    const rows = await this.db.query(
      `SELECT id, name, category, unit,
       current_stock as "currentStock",
       min_stock_level as "minStockLevel"
       FROM products
       WHERE current_stock <= min_stock_level
       ORDER BY current_stock ASC`,
    );
    return rows;
  }
}
