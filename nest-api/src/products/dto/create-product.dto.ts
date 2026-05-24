import { IsString, IsNumber, IsOptional, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty({ example: 'Tata Salt 1kg' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ example: '8901234567890' })
  @IsString()
  @IsOptional()
  barcode?: string;

  @ApiProperty({ example: 'Grocery' })
  @IsString()
  @MaxLength(100)
  category: string;

  @ApiProperty({ example: 18 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  buyingPrice: number;

  @ApiProperty({ example: 25 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  sellingPrice: number;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  currentStock: number;

  @ApiProperty({ example: 5 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minStockLevel: number;

  @ApiProperty({ example: 'kg' })
  @IsString()
  @MaxLength(50)
  unit: string;
}
