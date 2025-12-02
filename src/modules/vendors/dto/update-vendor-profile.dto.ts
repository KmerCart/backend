import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsObject,
  ValidateNested,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

class BusinessAddressDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  street?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  zipCode?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  country?: string;
}

class BankAccountDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  accountNumber?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  routingNumber?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  accountHolderName?: string;
}

export class UpdateVendorProfileDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  businessName?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  businessDescription?: string;

  @ApiProperty({ type: BusinessAddressDto })
  @IsObject()
  @ValidateNested()
  @Type(() => BusinessAddressDto)
  @IsOptional()
  businessAddress?: BusinessAddressDto;

  @ApiProperty()
  @IsString()
  @IsOptional()
  taxId?: string;

  @ApiProperty({ type: BankAccountDto })
  @IsObject()
  @ValidateNested()
  @Type(() => BankAccountDto)
  @IsOptional()
  bankAccount?: BankAccountDto;
}
