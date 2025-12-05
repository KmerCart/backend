import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class ShippingAddressDto {
  @ApiProperty()
  @IsString()
  fullName: string;

  @ApiProperty()
  @IsString()
  street: string;

  @ApiProperty()
  @IsString()
  city: string;

  @ApiProperty()
  @IsString()
  state: string;

  @ApiProperty()
  @IsString()
  zipCode: string;

  @ApiProperty()
  @IsString()
  country: string;

  @ApiProperty()
  @IsString()
  phone: string;
}

export class CreateOrderDto {
  @ApiProperty()
  @IsString()
  paymentMethod: string;

  @ApiProperty({ type: ShippingAddressDto })
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @ApiProperty({ type: ShippingAddressDto, required: false })
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  @IsOptional()
  billingAddress?: ShippingAddressDto;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  shippingCost?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  discount?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
