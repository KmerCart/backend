import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/schemas/user.schema';
import { Order } from '../../orders/schemas/order.schema';

export enum PayoutStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Schema({ _id: false })
export class PayoutPeriod {
  @ApiProperty()
  @Prop({ required: true })
  startDate: Date;

  @ApiProperty()
  @Prop({ required: true })
  endDate: Date;
}

@Schema({ _id: false })
export class PayoutBankAccount {
  @ApiProperty()
  @Prop({ required: true })
  accountNumber: string;

  @ApiProperty()
  @Prop({ required: true })
  accountHolderName: string;
}

@Schema({ timestamps: true })
export class Payout {
  @ApiProperty({ type: String })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  vendorId: Types.ObjectId | User;

  @ApiProperty()
  @Prop({ required: true, min: 0 })
  amount: number;

  @ApiProperty()
  @Prop({ default: 'CFA' })
  currency: string;

  @ApiProperty({ enum: PayoutStatus })
  @Prop({ type: String, enum: PayoutStatus, default: PayoutStatus.PENDING })
  status: PayoutStatus;

  @ApiProperty()
  @Prop()
  paymentMethod: string;

  @ApiProperty()
  @Prop()
  transactionId: string;

  @ApiProperty({ type: [String] })
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Order' }] })
  orders: Types.ObjectId[] | Order[];

  @ApiProperty({ type: PayoutPeriod })
  @Prop({ type: PayoutPeriod, required: true })
  period: PayoutPeriod;

  @ApiProperty({ type: PayoutBankAccount })
  @Prop({ type: PayoutBankAccount, required: true })
  bankAccount: PayoutBankAccount;

  @ApiProperty()
  @Prop()
  notes: string;

  @ApiProperty()
  @Prop()
  processedAt: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export type PayoutDocument = Payout & Document;
export const PayoutSchema = SchemaFactory.createForClass(Payout);

// Indexes
PayoutSchema.index({ vendorId: 1 });
PayoutSchema.index({ status: 1 });
PayoutSchema.index({ createdAt: -1 });
