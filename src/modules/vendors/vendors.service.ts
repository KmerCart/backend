import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { Order, OrderDocument, OrderStatus } from '../orders/schemas/order.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateVendorProfileDto } from './dto/update-vendor-profile.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class VendorsService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
  ) {}

  // Profile Management
  async getProfile(vendorId: string) {
    const vendor = await this.userModel
      .findById(vendorId)
      .select('-password -refreshToken');

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    return vendor;
  }

  async updateProfile(
    vendorId: string,
    updateData: UpdateVendorProfileDto,
  ) {
    const vendor = await this.userModel.findById(vendorId);

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    // Initialize vendorProfile if it doesn't exist
    if (!vendor.vendorProfile) {
      vendor.vendorProfile = {} as any;
    }

    // Update vendor profile fields
    if (updateData.businessName !== undefined) {
      vendor.vendorProfile.businessName = updateData.businessName;
    }
    if (updateData.businessDescription !== undefined) {
      vendor.vendorProfile.businessDescription = updateData.businessDescription;
    }
    if (updateData.businessAddress) {
      if (!vendor.vendorProfile.businessAddress) {
        vendor.vendorProfile.businessAddress = {} as any;
      }
      vendor.vendorProfile.businessAddress = {
        ...(vendor.vendorProfile.businessAddress || {}),
        ...updateData.businessAddress,
      } as any;
    }
    if (updateData.taxId !== undefined) {
      vendor.vendorProfile.taxId = updateData.taxId;
    }
    if (updateData.bankAccount) {
      if (!vendor.vendorProfile.bankAccount) {
        vendor.vendorProfile.bankAccount = {} as any;
      }
      vendor.vendorProfile.bankAccount = {
        ...(vendor.vendorProfile.bankAccount || {}),
        ...updateData.bankAccount,
      } as any;
    }

    // Set defaults for required fields if they don't exist
    if (vendor.vendorProfile.isApproved === undefined) {
      vendor.vendorProfile.isApproved = false;
    }
    if (!vendor.vendorProfile.joinedDate) {
      vendor.vendorProfile.joinedDate = new Date();
    }
    if (!vendor.vendorProfile.commissionRate) {
      vendor.vendorProfile.commissionRate = 0.15;
    }
    if (vendor.vendorProfile.rating === undefined) {
      vendor.vendorProfile.rating = 0;
    }
    if (vendor.vendorProfile.totalSales === undefined) {
      vendor.vendorProfile.totalSales = 0;
    }

    // Mark the vendorProfile as modified to ensure it's saved
    vendor.markModified('vendorProfile');
    await vendor.save();

    return this.userModel
      .findById(vendorId)
      .select('-password -refreshToken');
  }

  // Product Management
  async createProduct(vendorId: string, createProductDto: CreateProductDto) {
    // Generate slug from name
    const slug = createProductDto.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Check if product with same SKU exists
    const existingProduct = await this.productModel.findOne({
      sku: createProductDto.sku,
    });

    if (existingProduct) {
      throw new BadRequestException('Product with this SKU already exists');
    }

    const product = new this.productModel({
      ...createProductDto,
      vendorId: new Types.ObjectId(vendorId),
      slug,
    });

    return product.save();
  }

  async getProducts(
    vendorId: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
    status?: string,
  ) {
    const skip = (page - 1) * limit;
    const query: any = { vendorId: new Types.ObjectId(vendorId) };

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }

    // Status filter
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    } else if (status === 'low-stock') {
      query.$expr = {
        $and: [
          { $gt: ['$stock', 0] },
          { $lte: ['$stock', '$lowStockThreshold'] },
        ],
      };
    } else if (status === 'out-of-stock') {
      query.stock = 0;
    }

    const [products, total] = await Promise.all([
      this.productModel
        .find(query)
        .populate('categoryId', 'name slug')
        .populate('subcategoryId', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      this.productModel.countDocuments(query),
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

  async getProduct(vendorId: string, productId: string) {
    const product = await this.productModel
      .findOne({
        _id: productId,
        vendorId: new Types.ObjectId(vendorId),
      })
      .populate('categoryId', 'name slug')
      .populate('subcategoryId', 'name slug');

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async updateProduct(
    vendorId: string,
    productId: string,
    updateProductDto: UpdateProductDto,
  ) {
    const product = await this.productModel.findOne({
      _id: productId,
      vendorId: new Types.ObjectId(vendorId),
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Update slug if name changes
    if (updateProductDto.name && updateProductDto.name !== product.name) {
      updateProductDto['slug'] = updateProductDto.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }

    Object.assign(product, updateProductDto);
    await product.save();

    return product;
  }

  async deleteProduct(vendorId: string, productId: string) {
    const product = await this.productModel.findOne({
      _id: productId,
      vendorId: new Types.ObjectId(vendorId),
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Soft delete by setting isActive to false
    product.isActive = false;
    await product.save();

    return { message: 'Product deleted successfully' };
  }

  async updateProductStock(
    vendorId: string,
    productId: string,
    stock: number,
  ) {
    const product = await this.productModel.findOne({
      _id: productId,
      vendorId: new Types.ObjectId(vendorId),
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    product.stock = stock;
    await product.save();

    return product;
  }

  // Order Management
  async getOrders(
    vendorId: string,
    page: number = 1,
    limit: number = 10,
    status?: OrderStatus,
  ) {
    const skip = (page - 1) * limit;
    const query: any = {
      'items.vendorId': new Types.ObjectId(vendorId),
    };

    if (status) {
      query.status = status;
    }

    const [orders, total] = await Promise.all([
      this.orderModel
        .find(query)
        .populate('customerId', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      this.orderModel.countDocuments(query),
    ]);

    // Filter items to only include vendor's items
    const vendorOrders = orders.map((order) => {
      const orderObj = order.toObject();
      orderObj.items = orderObj.items.filter(
        (item: any) => item.vendorId.toString() === vendorId,
      );
      return orderObj;
    });

    return {
      orders: vendorOrders,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getOrder(vendorId: string, orderId: string) {
    const order = await this.orderModel
      .findOne({
        _id: orderId,
        'items.vendorId': new Types.ObjectId(vendorId),
      })
      .populate('customerId', 'firstName lastName email phone');

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Filter items to only include vendor's items
    const orderObj = order.toObject();
    orderObj.items = orderObj.items.filter(
      (item: any) => item.vendorId.toString() === vendorId,
    );

    return orderObj;
  }

  async updateOrderStatus(
    vendorId: string,
    orderId: string,
    updateStatusDto: UpdateOrderStatusDto,
  ) {
    const order = await this.orderModel.findOne({
      _id: orderId,
      'items.vendorId': new Types.ObjectId(vendorId),
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Update order status
    order.status = updateStatusDto.status;

    // Update tracking number if provided
    if (updateStatusDto.trackingNumber) {
      order.trackingNumber = updateStatusDto.trackingNumber;
    }

    // Add to status history
    order.statusHistory.push({
      status: updateStatusDto.status,
      timestamp: new Date(),
      note: updateStatusDto.note || '',
    });

    // Update deliveredAt if status is delivered
    if (updateStatusDto.status === OrderStatus.DELIVERED) {
      order.deliveredAt = new Date();
    }

    await order.save();

    return order;
  }

  // Analytics & Statistics
  async getDashboardStats(vendorId: string) {
    const vendorObjectId = new Types.ObjectId(vendorId);

    // Get product count
    const totalProducts = await this.productModel.countDocuments({
      vendorId: vendorObjectId,
    });

    const activeProducts = await this.productModel.countDocuments({
      vendorId: vendorObjectId,
      isActive: true,
    });

    const lowStockProducts = await this.productModel.countDocuments({
      vendorId: vendorObjectId,
      $expr: {
        $and: [
          { $gt: ['$stock', 0] },
          { $lte: ['$stock', '$lowStockThreshold'] },
        ],
      },
    });

    const outOfStockProducts = await this.productModel.countDocuments({
      vendorId: vendorObjectId,
      stock: 0,
    });

    // Get order statistics
    const totalOrders = await this.orderModel.countDocuments({
      'items.vendorId': vendorObjectId,
    });

    const pendingOrders = await this.orderModel.countDocuments({
      'items.vendorId': vendorObjectId,
      status: OrderStatus.PENDING,
    });

    const processingOrders = await this.orderModel.countDocuments({
      'items.vendorId': vendorObjectId,
      status: OrderStatus.PROCESSING,
    });

    const shippedOrders = await this.orderModel.countDocuments({
      'items.vendorId': vendorObjectId,
      status: OrderStatus.SHIPPED,
    });

    const deliveredOrders = await this.orderModel.countDocuments({
      'items.vendorId': vendorObjectId,
      status: OrderStatus.DELIVERED,
    });

    // Calculate total sales
    const salesAggregation = await this.orderModel.aggregate([
      {
        $match: {
          'items.vendorId': vendorObjectId,
          status: { $ne: OrderStatus.CANCELLED },
        },
      },
      { $unwind: '$items' },
      {
        $match: {
          'items.vendorId': vendorObjectId,
        },
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$items.total' },
          totalRevenue: { $sum: '$items.total' },
        },
      },
    ]);

    const totalSales = salesAggregation[0]?.totalSales || 0;
    const totalRevenue = salesAggregation[0]?.totalRevenue || 0;

    // Get recent orders
    const recentOrders = await this.orderModel
      .find({
        'items.vendorId': vendorObjectId,
      })
      .populate('customerId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(5);

    // Filter items to only include vendor's items
    const vendorRecentOrders = recentOrders.map((order) => {
      const orderObj = order.toObject();
      orderObj.items = orderObj.items.filter(
        (item: any) => item.vendorId.toString() === vendorId,
      );
      return orderObj;
    });

    return {
      products: {
        total: totalProducts,
        active: activeProducts,
        lowStock: lowStockProducts,
        outOfStock: outOfStockProducts,
      },
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        processing: processingOrders,
        shipped: shippedOrders,
        delivered: deliveredOrders,
      },
      sales: {
        total: totalSales,
        revenue: totalRevenue,
      },
      recentOrders: vendorRecentOrders,
    };
  }

  async getSalesAnalytics(
    vendorId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const vendorObjectId = new Types.ObjectId(vendorId);
    const matchQuery: any = {
      'items.vendorId': vendorObjectId,
      status: { $ne: OrderStatus.CANCELLED },
    };

    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = startDate;
      if (endDate) matchQuery.createdAt.$lte = endDate;
    }

    // Daily sales
    const dailySales = await this.orderModel.aggregate([
      { $match: matchQuery },
      { $unwind: '$items' },
      {
        $match: {
          'items.vendorId': vendorObjectId,
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          sales: { $sum: '$items.total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Top selling products
    const topProducts = await this.orderModel.aggregate([
      { $match: matchQuery },
      { $unwind: '$items' },
      {
        $match: {
          'items.vendorId': vendorObjectId,
        },
      },
      {
        $group: {
          _id: '$items.productId',
          productName: { $first: '$items.name' },
          totalSold: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.total' },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
    ]);

    return {
      dailySales,
      topProducts,
    };
  }
}
