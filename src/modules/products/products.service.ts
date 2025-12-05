import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product } from './schemas/product.schema';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
  ) {}

  /**
   * Get all active products for public browsing
   */
  async getAllProducts(query: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    subcategory?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    featured?: boolean;
  }) {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      subcategory,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      featured,
    } = query;

    const filter: any = { isActive: true };

    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    // Category filter
    if (category) {
      filter.categoryId = category;
    }

    // Subcategory filter
    if (subcategory) {
      filter.subcategoryId = subcategory;
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = minPrice;
      if (maxPrice !== undefined) filter.price.$lte = maxPrice;
    }

    // Featured filter
    if (featured !== undefined) {
      filter.isFeatured = featured;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Sort options
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const [products, total] = await Promise.all([
      this.productModel
        .find(filter)
        .populate('vendorId', 'businessName rating')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.productModel.countDocuments(filter),
    ]);

    return {
      products,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single product by ID
   */
  async getProductById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid product ID');
    }

    const product = await this.productModel
      .findOne({ _id: id, isActive: true })
      .populate('vendorId', 'businessName rating businessDescription')
      .lean()
      .exec();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  /**
   * Get a single product by slug
   */
  async getProductBySlug(slug: string) {
    const product = await this.productModel
      .findOne({ slug, isActive: true })
      .populate('vendorId', 'businessName rating businessDescription')
      .lean()
      .exec();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  /**
   * Get featured products for homepage
   */
  async getFeaturedProducts(limit: number = 8) {
    const products = await this.productModel
      .find({ isActive: true, isFeatured: true })
      .populate('vendorId', 'businessName rating')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();

    return products;
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(
    categoryId: string,
    options: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {},
  ) {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = options;

    const filter = {
      categoryId: categoryId,
      isActive: true,
    };

    const skip = (page - 1) * limit;
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [products, total] = await Promise.all([
      this.productModel
        .find(filter)
        .populate('vendorId', 'businessName rating')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.productModel.countDocuments(filter),
    ]);

    return {
      products,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get related products (same category, excluding current product)
   */
  async getRelatedProducts(productId: string, limit: number = 4) {
    if (!Types.ObjectId.isValid(productId)) {
      throw new NotFoundException('Invalid product ID');
    }

    const product = await this.productModel.findById(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const relatedProducts = await this.productModel
      .find({
        categoryId: product.categoryId,
        _id: { $ne: productId },
        isActive: true,
      })
      .populate('vendorId', 'businessName rating')
      .sort({ totalSales: -1, rating: -1 })
      .limit(limit)
      .lean()
      .exec();

    return relatedProducts;
  }

  /**
   * Search products with autocomplete
   */
  async searchProducts(searchTerm: string, limit: number = 10) {
    const products = await this.productModel
      .find(
        {
          $text: { $search: searchTerm },
          isActive: true,
        },
        { score: { $meta: 'textScore' } },
      )
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .select('name slug mainImage price')
      .lean()
      .exec();

    return products;
  }
}
