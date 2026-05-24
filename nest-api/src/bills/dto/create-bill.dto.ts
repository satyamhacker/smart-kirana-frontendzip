import {
  IsNumber, IsOptional, IsString, IsEnum, IsArray,
  ValidateNested, Min, ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum PaymentMode {
  CASH = 'cash',
  UPI = 'upi',
  KHATA = 'khata',
}

export class BillItemDto {
  @ApiPropertyOptional() @IsNumber() @IsOptional() @Type(() => Number) productId?: number;
  @ApiPropertyOptional() @IsString() @IsOptional() productName?: string;
  @ApiProperty() @IsNumber() @Min(0.001) @Type(() => Number) quantity: number;
  @ApiProperty() @IsNumber() @Min(0) @Type(() => Number) unitPrice: number;
  @ApiProperty() @IsNumber() @Min(0) @Type(() => Number) totalPrice: number;
}

export class CreateBillDto {
  @ApiPropertyOptional() @IsNumber() @IsOptional() @Type(() => Number) customerId?: number;

  @ApiProperty({ type: [BillItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BillItemDto)
  items: BillItemDto[];

  @ApiProperty() @IsNumber() @Min(0) @Type(() => Number) totalAmount: number;
  @ApiProperty() @IsNumber() @Min(0) @Type(() => Number) discountAmount: number;
  @ApiProperty() @IsNumber() @Min(0) @Type(() => Number) finalAmount: number;

  @ApiProperty({ enum: PaymentMode, example: 'cash' })
  @IsEnum(PaymentMode)
  paymentMode: PaymentMode;
}
