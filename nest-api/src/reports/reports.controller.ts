import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  getSales(@Query('from') from: string, @Query('to') to: string) {
    return this.reportsService.getSales(from, to);
  }

  @Get('profit')
  getProfit(@Query('from') from: string, @Query('to') to: string) {
    return this.reportsService.getProfit(from, to);
  }

  @Get('khata')
  getKhata() {
    return this.reportsService.getKhata();
  }

  @Get('lowstock')
  getLowStock() {
    return this.reportsService.getLowStock();
  }
}
