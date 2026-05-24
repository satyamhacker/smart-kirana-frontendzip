import { IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ReportFilterDto {
  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsString()
  @IsOptional()
  from?: string;

  @ApiPropertyOptional({ example: '2026-01-31' })
  @IsString()
  @IsOptional()
  to?: string;

  @ApiPropertyOptional({ example: 'daily', enum: ['daily', 'weekly', 'monthly'] })
  @IsString()
  @IsOptional()
  period?: string;
}
