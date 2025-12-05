import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/schemas/user.schema';

@Schema({ _id: false })
export class ProductAttribute {
  @ApiProperty()
  @Prop({ required: true })
  name: string;

  @ApiProperty()
  @Prop({ required: true })
  value: string;
}

@Schema({ _id: false })
export class ProductDimensions {
  @ApiProperty()
  @Prop()
  length: number;

  @ApiProperty()
  @Prop()
  width: number;

  @ApiProperty()
  @Prop()
  height: number;
}

@Schema({ _id: false })
export class ProductSEO {
  @ApiProperty()
  @Prop()
  metaTitle: string;

  @ApiProperty()
  @Prop()
  metaDescription: string;

  @ApiProperty({ type: [String] })
  @Prop({ type: [String] })
  keywords: string[];
}

@Schema({ timestamps: true })
export class Product {
  @ApiProperty({ type: String })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  vendorId: Types.ObjectId | User;

  @ApiProperty()
  @Prop({ required: true, trim: true })
  name: string;

  @ApiProperty()
  @Prop({ required: true, unique: true, lowercase: true })
  slug: string;

  @ApiProperty()
  @Prop({ required: true })
  description: string;

  @ApiProperty()
  @Prop()
  shortDescription: string;

  @ApiProperty({ type: String })
  @Prop({ type: String, required: true })
  categoryId: string;

  @ApiProperty({ type: String })
  @Prop({ type: String })
  subcategoryId: string;

  @ApiProperty()
  @Prop({ required: true, min: 0 })
  price: number;

  @ApiProperty()
  @Prop({ min: 0 })
  originalPrice: number;

  @ApiProperty()
  @Prop({ min: 0, max: 100, default: 0 })
  discount: number;

  @ApiProperty()
  @Prop({ default: 'CFA' })
  currency: string;

  @ApiProperty({ type: [String] })
  @Prop({ type: [String], default: [] })
  images: string[];

  @ApiProperty()
  @Prop()
  mainImage: string;

  @ApiProperty()
  @Prop({ required: true, unique: true })
  sku: string;

  @ApiProperty()
  @Prop({ required: true, min: 0, default: 0 })
  stock: number;

  @ApiProperty()
  @Prop({ default: 10 })
  lowStockThreshold: number;

  @ApiProperty({ type: [ProductAttribute] })
  @Prop({ type: [ProductAttribute], default: [] })
  attributes: ProductAttribute[];

  @ApiProperty({ type: [String] })
  @Prop({ type: [String], default: [] })
  tags: string[];

  @ApiProperty()
  @Prop({ default: false })
  isFeatured: boolean;

  @ApiProperty()
  @Prop({ default: true })
  isActive: boolean;

  @ApiProperty()
  @Prop({ default: 0, min: 0, max: 5 })
  rating: number;

  @ApiProperty()
  @Prop({ default: 0, min: 0 })
  reviewCount: number;

  @ApiProperty()
  @Prop({ default: 0, min: 0 })
  totalSales: number;

  @ApiProperty()
  @Prop({ min: 0 })
  weight: number;

  @ApiProperty({ type: ProductDimensions })
  @Prop({ type: ProductDimensions })
  dimensions: ProductDimensions;

  @ApiProperty({ type: ProductSEO })
  @Prop({ type: ProductSEO })
  seo: ProductSEO;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export type ProductDocument = Product & Document;
export const ProductSchema = SchemaFactory.createForClass(Product);

// Indexes
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });
ProductSchema.index({ slug: 1 });
ProductSchema.index({ vendorId: 1 });
ProductSchema.index({ categoryId: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ rating: -1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ isFeatured: 1, isActive: 1 });

// Virtual for in stock
ProductSchema.virtual('inStock').get(function () {
  return this.stock > 0;
});

// Virtual for low stock
ProductSchema.virtual('isLowStock').get(function () {
  return this.stock > 0 && this.stock <= this.lowStockThreshold;
});

ProductSchema.set('toJSON', { virtuals: true });
ProductSchema.set('toObject', { virtuals: true });
