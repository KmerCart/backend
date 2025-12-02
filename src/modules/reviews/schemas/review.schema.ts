import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/schemas/user.schema';
import { Product } from '../../products/schemas/product.schema';
import { Order } from '../../orders/schemas/order.schema';

@Schema({ _id: false })
export class VendorResponse {
  @ApiProperty()
  @Prop({ required: true })
  comment: string;

  @ApiProperty()
  @Prop({ default: Date.now })
  respondedAt: Date;
}

@Schema({ timestamps: true })
export class Review {
  @ApiProperty({ type: String })
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId | Product;

  @ApiProperty({ type: String })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId | User;

  @ApiProperty({ type: String })
  @Prop({ type: Types.ObjectId, ref: 'Order' })
  orderId: Types.ObjectId | Order;

  @ApiProperty()
  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @ApiProperty()
  @Prop({ required: true })
  title: string;

  @ApiProperty()
  @Prop({ required: true })
  comment: string;

  @ApiProperty({ type: [String] })
  @Prop({ type: [String], default: [] })
  images: string[];

  @ApiProperty()
  @Prop({ default: false })
  isVerifiedPurchase: boolean;

  @ApiProperty()
  @Prop({ default: 0, min: 0 })
  helpfulCount: number;

  @ApiProperty()
  @Prop({ default: 0, min: 0 })
  reportCount: number;

  @ApiProperty()
  @Prop({ default: true })
  isApproved: boolean;

  @ApiProperty({ type: VendorResponse })
  @Prop({ type: VendorResponse })
  vendorResponse: VendorResponse;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export type ReviewDocument = Review & Document;
export const ReviewSchema = SchemaFactory.createForClass(Review);

// Indexes
ReviewSchema.index({ productId: 1 });
ReviewSchema.index({ userId: 1 });
ReviewSchema.index({ rating: 1 });
ReviewSchema.index({ createdAt: -1 });
