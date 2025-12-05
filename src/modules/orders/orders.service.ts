import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderStatus, PaymentStatus } from './schemas/order.schema';
import { Cart } from '../cart/schemas/cart.schema';
import { Product } from '../products/schemas/product.schema';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Cart.name) private cartModel: Model<Cart>,
    @InjectModel(Product.name) private productModel: Model<Product>,
  ) {}

  /**
   * Generate unique order number
   */
  private async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    const count = await this.orderModel.countDocuments();
    const orderNum = String(count + 1).padStart(6, '0');

    return `ORD${year}${month}${day}${orderNum}`;
  }

  /**
   * Create order from cart
   */
  async createOrder(userId: string, createOrderDto: CreateOrderDto) {
    // Get user's cart
    const cart = await this.cartModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .populate('items.productId')
      .exec();

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Validate all products and stock
    const orderItems = [];
    let subtotal = 0;

    for (const cartItem of cart.items) {
      const product = cartItem.productId as any;

      if (!product || !product.isActive) {
        throw new BadRequestException(
          `Product ${product?.name || 'unknown'} is no longer available`,
        );
      }

      if (product.stock < cartItem.quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${product.name}. Only ${product.stock} available`,
        );
      }

      const itemTotal = cartItem.quantity * cartItem.price;
      subtotal += itemTotal;

      orderItems.push({
        productId: product._id,
        vendorId: product.vendorId,
        name: product.name,
        image: product.mainImage || product.images[0],
        quantity: cartItem.quantity,
        price: cartItem.price,
        discount: product.discount || 0,
        total: itemTotal,
      });
    }

    // Calculate totals
    const taxRate = 0.08; // 8% tax
    const tax = subtotal * taxRate;
    const shippingCost = createOrderDto.shippingCost || 0;
    const discount = createOrderDto.discount || 0;
    const total = subtotal + tax + shippingCost - discount;

    // Generate order number
    const orderNumber = await this.generateOrderNumber();

    // Create order
    const order = await this.orderModel.create({
      orderNumber,
      customerId: new Types.ObjectId(userId),
      items: orderItems,
      subtotal,
      tax,
      taxRate,
      shippingCost,
      discount,
      total,
      currency: 'CFA',
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      paymentMethod: createOrderDto.paymentMethod,
      shippingAddress: createOrderDto.shippingAddress,
      billingAddress:
        createOrderDto.billingAddress || createOrderDto.shippingAddress,
      notes: createOrderDto.notes,
      statusHistory: [
        {
          status: OrderStatus.PENDING,
          timestamp: new Date(),
          note: 'Order placed',
        },
      ],
    });

    // Reduce stock for all products
    for (const item of orderItems) {
      await this.productModel.updateOne(
        { _id: item.productId },
        { $inc: { stock: -item.quantity, totalSales: item.quantity } },
      );
    }

    // Clear cart
    await this.cartModel.updateOne(
      { userId: new Types.ObjectId(userId) },
      { items: [] },
    );

    return this.orderModel
      .findById(order._id)
      .populate('customerId', 'firstName lastName email')
      .populate('items.productId', 'name slug mainImage')
      .populate('items.vendorId', 'businessName')
      .exec();
  }

  /**
   * Get customer orders
   */
  async getCustomerOrders(
    userId: string,
    page: number = 1,
    limit: number = 10,
    status?: OrderStatus,
  ) {
    const filter: any = { customerId: new Types.ObjectId(userId) };
    if (status) {
      filter.status = status;
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.orderModel
        .find(filter)
        .populate('items.vendorId', 'businessName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.orderModel.countDocuments(filter),
    ]);

    return {
      orders,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get vendor orders (orders containing vendor's products)
   */
  async getVendorOrders(
    vendorId: string,
    page: number = 1,
    limit: number = 10,
    status?: OrderStatus,
  ) {
    const filter: any = {
      'items.vendorId': new Types.ObjectId(vendorId),
    };

    if (status) {
      filter.status = status;
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.orderModel
        .find(filter)
        .populate('customerId', 'firstName lastName email phone')
        .populate('items.productId', 'name slug mainImage')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.orderModel.countDocuments(filter),
    ]);

    // Filter items to only show vendor's products
    const filteredOrders = orders.map((order: any) => ({
      ...order,
      items: order.items.filter(
        (item: any) => item.vendorId.toString() === vendorId,
      ),
    }));

    return {
      orders: filteredOrders,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single order
   */
  async getOrder(orderId: string, userId: string, role: string) {
    const order = await this.orderModel
      .findById(orderId)
      .populate('customerId', 'firstName lastName email phone')
      .populate('items.productId', 'name slug mainImage')
      .populate('items.vendorId', 'businessName')
      .exec();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check authorization
    if (role === 'customer' && order.customerId.toString() !== userId) {
      throw new ForbiddenException('Access denied');
    }

    if (role === 'vendor') {
      const hasVendorProduct = order.items.some(
        (item: any) => item.vendorId._id.toString() === userId,
      );
      if (!hasVendorProduct) {
        throw new ForbiddenException('Access denied');
      }
    }

    return order;
  }

  /**
   * Update order status (vendor only)
   */
  async updateOrderStatus(
    orderId: string,
    vendorId: string,
    status: OrderStatus,
    note?: string,
  ) {
    const order = await this.orderModel.findById(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check if vendor has products in this order
    const hasVendorProduct = order.items.some(
      (item: any) => item.vendorId.toString() === vendorId,
    );

    if (!hasVendorProduct) {
      throw new ForbiddenException('Access denied');
    }

    // Update status
    order.status = status;
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      note: note || `Status updated to ${status}`,
    } as any);

    if (status === OrderStatus.DELIVERED) {
      order.deliveredAt = new Date();
    }

    await order.save();

    return this.getOrder(orderId, vendorId, 'vendor');
  }

  /**
   * Cancel order (customer only, before processing)
   */
  async cancelOrder(orderId: string, userId: string, reason?: string) {
    const order = await this.orderModel.findById(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.customerId.toString() !== userId) {
      throw new ForbiddenException('Access denied');
    }

    if (
      order.status !== OrderStatus.PENDING &&
      order.status !== OrderStatus.CONFIRMED
    ) {
      throw new BadRequestException(
        'Order cannot be cancelled at this stage',
      );
    }

    // Restore stock
    for (const item of order.items) {
      await this.productModel.updateOne(
        { _id: item.productId },
        { $inc: { stock: item.quantity, totalSales: -item.quantity } },
      );
    }

    order.status = OrderStatus.CANCELLED;
    order.statusHistory.push({
      status: OrderStatus.CANCELLED,
      timestamp: new Date(),
      note: reason || 'Cancelled by customer',
    } as any);

    await order.save();

    return order;
  }

  /**
   * Get order statistics for vendor
   */
  async getVendorOrderStats(vendorId: string) {
    const orders = await this.orderModel
      .find({ 'items.vendorId': new Types.ObjectId(vendorId) })
      .lean()
      .exec();

    let totalRevenue = 0;
    let pending = 0;
    let processing = 0;
    let shipped = 0;
    let delivered = 0;

    for (const order of orders) {
      // Calculate vendor's revenue from this order
      const vendorItems = (order.items as any[]).filter(
        (item) => item.vendorId.toString() === vendorId,
      );
      const vendorRevenue = vendorItems.reduce(
        (sum, item) => sum + item.total,
        0,
      );
      totalRevenue += vendorRevenue;

      // Count by status
      if (order.status === OrderStatus.PENDING) pending++;
      else if (order.status === OrderStatus.PROCESSING) processing++;
      else if (order.status === OrderStatus.SHIPPED) shipped++;
      else if (order.status === OrderStatus.DELIVERED) delivered++;
    }

    return {
      totalOrders: orders.length,
      totalRevenue,
      pending,
      processing,
      shipped,
      delivered,
    };
  }
}
