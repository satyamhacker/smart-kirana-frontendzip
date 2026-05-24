import { Controller, Get, Post, Delete, Param, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { CustomersService } from './customers.service';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  findAll(@Query('search') search?: string) {
    return this.customersService.findAll(search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(+id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: { name: string; phone: string; address?: string }) {
    return this.customersService.create(body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.customersService.remove(+id);
  }

  @Post(':id/transactions')
  @HttpCode(HttpStatus.CREATED)
  addTransaction(
    @Param('id') id: string,
    @Body() body: { type: 'credit' | 'payment'; amount: number; description: string },
  ) {
    return this.customersService.addTransaction(+id, body);
  }
}
