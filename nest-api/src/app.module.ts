import { Module, OnModuleInit } from '@nestjs/common';
import { DbModule } from './db/db.module';
import { DbService } from './db/db.service';
import { DashboardModule } from './dashboard/dashboard.module';
import { ProductsModule } from './products/products.module';
import { CustomersModule } from './customers/customers.module';
import { BillsModule } from './bills/bills.module';
import { ReportsModule } from './reports/reports.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [
    DbModule,
    DashboardModule,
    ProductsModule,
    CustomersModule,
    BillsModule,
    ReportsModule,
    SettingsModule,
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly db: DbService) {}

  async onModuleInit() {
    await this.db.initDB();
  }
}
