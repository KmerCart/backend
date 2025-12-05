import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export enum UserRole {
  CUSTOMER = 'customer',
  VENDOR = 'vendor',
  ADMIN = 'admin',
}

@Schema({ _id: false })
export class BankAccount {
  @ApiProperty()
  @Prop({ required: true })
  accountNumber: string;

  @ApiProperty()
  @Prop({ required: true })
  routingNumber: string;

  @ApiProperty()
  @Prop({ required: true })
  accountHolderName: string;
}

@Schema({ _id: false })
export class Address {
  @ApiProperty()
  @Prop()
  street: string;

  @ApiProperty()
  @Prop()
  city: string;

  @ApiProperty()
  @Prop()
  state: string;

  @ApiProperty()
  @Prop()
  zipCode: string;

  @ApiProperty()
  @Prop()
  country: string;
}

@Schema({ _id: false })
export class VendorProfile {
  @ApiProperty()
  @Prop()
  businessName: string;

  @ApiProperty()
  @Prop()
  businessDescription: string;

  @ApiProperty()
  @Prop()
  businessLogo: string;

  @ApiProperty({ type: Address })
  @Prop({ type: Address })
  businessAddress: Address;

  @ApiProperty()
  @Prop()
  taxId: string;

  @ApiProperty({ type: BankAccount })
  @Prop({ type: BankAccount })
  bankAccount: BankAccount;

  @ApiProperty()
  @Prop({ default: 0.15 })
  commissionRate: number;

  @ApiProperty()
  @Prop({ default: false })
  isApproved: boolean;

  @ApiProperty()
  @Prop({ default: 0 })
  rating: number;

  @ApiProperty()
  @Prop({ default: 0 })
  totalSales: number;

  @ApiProperty()
  @Prop({ default: Date.now })
  joinedDate: Date;
}

@Schema({ timestamps: true })
export class User {
  @ApiProperty()
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @ApiProperty()
  @Prop({ required: true })
  firstName: string;

  @ApiProperty()
  @Prop({ required: true })
  lastName: string;

  @ApiProperty({ enum: UserRole })
  @Prop({ type: String, enum: UserRole, default: UserRole.CUSTOMER })
  role: UserRole;

  @ApiProperty()
  @Prop()
  avatar: string;

  @ApiProperty()
  @Prop()
  phone: string;

  @ApiProperty()
  @Prop({ default: false })
  isEmailVerified: boolean;

  @ApiProperty()
  @Prop({ default: true })
  isActive: boolean;

  @Prop({ select: false })
  refreshToken: string;

  @Prop()
  emailVerificationToken: string;

  @Prop()
  passwordResetToken: string;

  @Prop()
  passwordResetExpires: Date;

  @ApiProperty({ type: VendorProfile })
  @Prop({ type: VendorProfile })
  vendorProfile: VendorProfile;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });

// Virtual for full name
UserSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtuals are included in JSON
UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });
