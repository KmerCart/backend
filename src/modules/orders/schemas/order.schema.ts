import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/schemas/user.schema';
import { Product } from '../../products/schemas/product.schema';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

@Schema({ _id: false })
export class OrderItem {
  @ApiProperty({ type: String })
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId | Product;

  @ApiProperty({ type: String })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  vendorId: Types.ObjectId | User;

  @ApiProperty()
  @Prop({ required: true })
  name: string;

  @ApiProperty()
  @Prop()
  image: string;

  @ApiProperty()
  @Prop({ required: true, min: 1 })
  quantity: number;

  @ApiProperty()
  @Prop({ required: true, min: 0 })
  price: number;

  @ApiProperty()
  @Prop({ default: 0, min: 0 })
  discount: number;

  @ApiProperty()
  @Prop({ required: true, min: 0 })
  total: number;
}

@Schema({ _id: false })
export class ShippingAddress {
  @ApiProperty()
  @Prop({ required: true })
  fullName: string;

  @ApiProperty()
  @Prop({ required: true })
  street: string;

  @ApiProperty()
  @Prop({ required: true })
  city: string;

  @ApiProperty()
  @Prop({ required: true })
  state: string;

  @ApiProperty()
  @Prop({ required: true })
  zipCode: string;

  @ApiProperty()
  @Prop({ required: true })
  country: string;

  @ApiProperty()
  @Prop({ required: true })
  phone: string;
}

@Schema({ _id: false })
export class BillingAddress {
  @ApiProperty()
  @Prop({ required: true })
  fullName: string;

  @ApiProperty()
  @Prop({ required: true })
  street: string;

  @ApiProperty()
  @Prop({ required: true })
  city: string;

  @ApiProperty()
  @Prop({ required: true })
  state: string;

  @ApiProperty()
  @Prop({ required: true })
  zipCode: string;

  @ApiProperty()
  @Prop({ required: true })
  country: string;
}

@Schema({ _id: false })
export class StatusHistory {
  @ApiProperty({ enum: OrderStatus })
  @Prop({ type: String, enum: OrderStatus, required: true })
  status: OrderStatus;

  @ApiProperty()
  @Prop({ default: Date.now })
  timestamp: Date;

  @ApiProperty()
  @Prop()
  note: string;
}

@Schema({ timestamps: true })
export class Order {
  @ApiProperty()
  @Prop({ required: true, unique: true })
  orderNumber: string;

  @ApiProperty({ type: String })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  customerId: Types.ObjectId | User;

  @ApiProperty({ type: [OrderItem] })
  @Prop({ type: [OrderItem], required: true })
  items: OrderItem[];

  @ApiProperty()
  @Prop({ required: true, min: 0 })
  subtotal: number;

  @ApiProperty()
  @Prop({ required: true, min: 0 })
  tax: number;

  @ApiProperty()
  @Prop({ default: 0.08 })
  taxRate: number;

  @ApiProperty()
  @Prop({ default: 0, min: 0 })
  shippingCost: number;

  @ApiProperty()
  @Prop({ default: 0, min: 0 })
  discount: number;

  @ApiProperty()
  @Prop({ required: true, min: 0 })
  total: number;

  @ApiProperty()
  @Prop({ default: 'CFA' })
  currency: string;

  @ApiProperty({ enum: OrderStatus })
  @Prop({ type: String, enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @ApiProperty({ enum: PaymentStatus })
  @Prop({ type: String, enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @ApiProperty()
  @Prop({ required: true })
  paymentMethod: string;

  @ApiProperty()
  @Prop()
  paymentIntentId: string;

  @ApiProperty({ type: ShippingAddress })
  @Prop({ type: ShippingAddress, required: true })
  shippingAddress: ShippingAddress;

  @ApiProperty({ type: BillingAddress })
  @Prop({ type: BillingAddress })
  billingAddress: BillingAddress;

  @ApiProperty()
  @Prop()
  trackingNumber: string;

  @ApiProperty()
  @Prop()
  notes: string;

  @ApiProperty({ type: [StatusHistory] })
  @Prop({ type: [StatusHistory], default: [] })
  statusHistory: StatusHistory[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  @Prop()
  deliveredAt: Date;
}

export type OrderDocument = Order & Document;
export const OrderSchema = SchemaFactory.createForClass(Order);

// Indexes
OrderSchema.index({ orderNumber: 1 });
OrderSchema.index({ customerId: 1 });
OrderSchema.index({ 'items.vendorId': 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });
