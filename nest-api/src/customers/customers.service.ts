import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from '../db/db.service';

@Injectable()
export class CustomersService {
  constructor(private readonly db: DbService) {}

  async findAll(search?: string) {
    let sql = `
      SELECT c.id, c.name, c.phone, c.address, c.created_at as "createdAt",
        COALESCE(SUM(CASE WHEN kt.type='credit' THEN kt.amount ELSE -kt.amount END), 0) as "totalDue"
      FROM customers c
      LEFT JOIN khata_transactions kt ON kt.customer_id = c.id
      WHERE 1=1
    `;
    const params: unknown[] = [];
    if (search) {
      sql += ` AND (c.name ILIKE $1 OR c.phone ILIKE $1)`;
      params.push(`%${search}%`);
    }
    sql += ` GROUP BY c.id ORDER BY c.name ASC`;

    const rows = await this.db.query(sql, params);
    return rows.map((r: any) => ({ ...r, totalDue: parseFloat(r.totalDue) }));
  }

  async findOne(id: number) {
    const customer = await this.db.queryOne(
      `SELECT c.id, c.name, c.phone, c.address, c.created_at as "createdAt",
       COALESCE(SUM(CASE WHEN kt.type='credit' THEN kt.amount ELSE -kt.amount END), 0) as "totalDue"
       FROM customers c
       LEFT JOIN khata_transactions kt ON kt.customer_id = c.id
       WHERE c.id = $1 GROUP BY c.id`,
      [id],
    );
    if (!customer) throw new NotFoundException('Customer not found');

    const transactions = await this.db.query(
      `SELECT id, type, amount, description, created_at as "createdAt"
       FROM khata_transactions WHERE customer_id = $1 ORDER BY created_at ASC`,
      [id],
    );

    return {
      ...(customer as any),
      totalDue: parseFloat((customer as any).totalDue),
      transactions: transactions.map((t: any) => ({ ...t, amount: parseFloat(t.amount) })),
    };
  }

  async create(data: { name: string; phone: string; address?: string }) {
    const rows = await this.db.query(
      `INSERT INTO customers (name, phone, address) VALUES ($1,$2,$3)
       RETURNING id, name, phone, address, created_at as "createdAt"`,
      [data.name, data.phone, data.address || null],
    );
    return { ...(rows[0] as any), totalDue: 0 };
  }

  async remove(id: number) {
    await this.db.query('DELETE FROM customers WHERE id = $1', [id]);
    return { success: true };
  }

  async addTransaction(customerId: number, data: { type: 'credit' | 'payment'; amount: number; description: string }) {
    const rows = await this.db.query(
      `INSERT INTO khata_transactions (customer_id, type, amount, description)
       VALUES ($1,$2,$3,$4) RETURNING id, type, amount, description, created_at as "createdAt"`,
      [customerId, data.type, data.amount, data.description],
    );
    const row: any = rows[0];
    return { ...row, amount: parseFloat(row.amount) };
  }
}
