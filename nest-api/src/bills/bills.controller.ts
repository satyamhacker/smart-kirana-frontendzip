import { Controller, Get, Post, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { BillsService } from './bills.service';
import { CreateBillDto } from './dto/create-bill.dto';

@ApiTags('bills')
@Controller('bills')
export class BillsController {
  constructor(private readonly billsService: BillsService) {}

  @Get()
  @ApiOperation({ summary: 'List recent bills (paginated)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  findAll(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    return this.billsService.findAll(+(limit ?? 50), +(offset ?? 0));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new bill (deducts stock, creates Khata entry if khata mode)' })
  @ApiResponse({ status: 201, description: 'Bill created successfully' })
  create(@Body() dto: CreateBillDto) {
    return this.billsService.create(dto);
  }
}
