import { IsString, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Ramesh Kumar' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: '9876543210' })
  @IsString()
  @Matches(/^[0-9+\-\s()]{7,20}$/, { message: 'phone must be a valid phone number' })
  phone: string;

  @ApiPropertyOptional({ example: 'Gandhi Nagar, Ward No. 5' })
  @IsString()
  @IsOptional()
  @MaxLength(300)
  address?: string;
}
