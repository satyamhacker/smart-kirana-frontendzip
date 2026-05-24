import { IsEnum, IsNumber, IsString, Min, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum TransactionType {
  CREDIT = 'credit',
  PAYMENT = 'payment',
}

export class CreateTransactionDto {
  @ApiProperty({ enum: TransactionType, example: 'payment' })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({ example: 200 })
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  amount: number;

  @ApiProperty({ example: 'Cash payment received' })
  @IsString()
  @MaxLength(300)
  description: string;
}
