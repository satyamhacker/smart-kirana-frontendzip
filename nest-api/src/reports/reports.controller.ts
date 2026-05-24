import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { ReportFilterDto } from './dto/report-filter.dto';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  @ApiOperation({ summary: 'Sales report grouped by date' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getSales(@Query() filter: ReportFilterDto) {
    return this.reportsService.getSales(filter.from ?? '', filter.to ?? '');
  }

  @Get('profit')
  @ApiOperation({ summary: 'Profit report (revenue minus cost) grouped by date' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getProfit(@Query() filter: ReportFilterDto) {
    return this.reportsService.getProfit(filter.from ?? '', filter.to ?? '');
  }

  @Get('khata')
  @ApiOperation({ summary: 'All customers with outstanding Khata balance' })
  getKhata() {
    return this.reportsService.getKhata();
  }

  @Get('lowstock')
  @ApiOperation({ summary: 'Products at or below minimum stock level' })
  getLowStock() {
    return this.reportsService.getLowStock();
  }
}
