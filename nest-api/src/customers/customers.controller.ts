import {
  Controller, Get, Post, Delete,
  Param, Body, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam, ApiResponse } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@ApiTags('customers')
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @ApiOperation({ summary: 'List all customers (with optional search)' })
  @ApiQuery({ name: 'search', required: false })
  findAll(@Query('search') search?: string) {
    return this.customersService.findAll(search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer with full Khata ledger' })
  @ApiParam({ name: 'id', type: Number })
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(+id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiResponse({ status: 201, description: 'Customer created successfully' })
  create(@Body() dto: CreateCustomerDto) {
    return this.customersService.create(dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a customer (cascades to Khata transactions)' })
  @ApiParam({ name: 'id', type: Number })
  remove(@Param('id') id: string) {
    return this.customersService.remove(+id);
  }

  @Post(':id/transactions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a Khata transaction (credit/payment)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 201, description: 'Transaction recorded' })
  addTransaction(@Param('id') id: string, @Body() dto: CreateTransactionDto) {
    return this.customersService.addTransaction(+id, dto);
  }
}
