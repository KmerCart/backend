import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/schemas/user.schema';

export enum NotificationType {
  ORDER_PLACED = 'order_placed',
  ORDER_SHIPPED = 'order_shipped',
  ORDER_DELIVERED = 'order_delivered',
  PAYOUT_PROCESSED = 'payout_processed',
  LOW_STOCK = 'low_stock',
  NEW_REVIEW = 'new_review',
  ACCOUNT_UPDATE = 'account_update',
  PROMOTION = 'promotion',
}

@Schema({ timestamps: true })
export class Notification {
  @ApiProperty({ type: String })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId | User;

  @ApiProperty({ enum: NotificationType })
  @Prop({ type: String, enum: NotificationType, required: true })
  type: NotificationType;

  @ApiProperty()
  @Prop({ required: true })
  title: string;

  @ApiProperty()
  @Prop({ required: true })
  message: string;

  @ApiProperty()
  @Prop({ type: Object, default: {} })
  data: Record<string, any>;

  @ApiProperty()
  @Prop({ default: false })
  isRead: boolean;

  @ApiProperty()
  @Prop()
  link: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  @Prop()
  readAt: Date;
}

export type NotificationDocument = Notification & Document;
export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Indexes
NotificationSchema.index({ userId: 1 });
NotificationSchema.index({ isRead: 1 });
NotificationSchema.index({ createdAt: -1 });
