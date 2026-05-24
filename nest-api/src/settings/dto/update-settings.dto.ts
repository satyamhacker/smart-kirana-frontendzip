import { IsString, IsOptional, IsBoolean, IsNumber, Min, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateSettingsDto {
  @ApiPropertyOptional({ example: 'Smart Kirana Store' })
  @IsString() @IsOptional() @MaxLength(200)
  shopName?: string;

  @ApiPropertyOptional({ example: 'Gandhi Nagar, Ward No. 5' })
  @IsString() @IsOptional() @MaxLength(500)
  shopAddress?: string;

  @ApiPropertyOptional({ example: '9876543210' })
  @IsString() @IsOptional() @MaxLength(20)
  shopPhone?: string;

  @ApiPropertyOptional({ example: 'Ramesh Kumar' })
  @IsString() @IsOptional() @MaxLength(100)
  ownerName?: string;

  @ApiPropertyOptional({ example: '22AAAAA0000A1Z5' })
  @IsString() @IsOptional() @MaxLength(15)
  gstNumber?: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean() @IsOptional()
  gstEnabled?: boolean;

  @ApiPropertyOptional({ example: '₹' })
  @IsString() @IsOptional() @MaxLength(5)
  currency?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsNumber() @Min(0) @IsOptional() @Type(() => Number)
  lowStockThreshold?: number;
}
