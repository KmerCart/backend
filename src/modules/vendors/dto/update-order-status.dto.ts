import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional } from 'class-validator';
import { OrderStatus } from '../../orders/schemas/order.schema';

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus })
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ApiProperty()
  @IsString()
  @IsOptional()
  trackingNumber?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  note?: string;
}
