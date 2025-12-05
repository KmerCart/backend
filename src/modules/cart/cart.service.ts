import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart, CartItem } from './schemas/cart.schema';
import { Product } from '../products/schemas/product.schema';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private cartModel: Model<Cart>,
    @InjectModel(Product.name) private productModel: Model<Product>,
  ) {}

  /**
   * Get user's cart
   */
  async getCart(userId: string) {
    const cart = await this.cartModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .populate('items.productId', 'name price mainImage images stock isActive')
      .lean()
      .exec();

    if (!cart) {
      // Create empty cart if doesn't exist
      const newCart = await this.cartModel.create({
        userId: new Types.ObjectId(userId),
        items: [],
      });
      return newCart;
    }

    // Filter out inactive products or out of stock items
    const validItems = cart.items.filter((item: any) => {
      const product = item.productId as any;
      return product && product.isActive && product.stock > 0;
    });

    // Update cart if items were filtered
    if (validItems.length !== cart.items.length) {
      await this.cartModel.updateOne(
        { userId: new Types.ObjectId(userId) },
        { items: validItems },
      );
    }

    return {
      ...cart,
      items: validItems,
    };
  }

  /**
   * Add item to cart
   */
  async addItem(userId: string, productId: string, quantity: number = 1) {
    // Validate product
    const product = await this.productModel.findById(productId);
    if (!product || !product.isActive) {
      throw new NotFoundException('Product not found or inactive');
    }

    if (product.stock < quantity) {
      throw new BadRequestException(
        `Only ${product.stock} items available in stock`,
      );
    }

    let cart = await this.cartModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    if (!cart) {
      // Create new cart
      cart = await this.cartModel.create({
        userId: new Types.ObjectId(userId),
        items: [
          {
            productId: new Types.ObjectId(productId),
            quantity,
            price: product.price,
          },
        ],
      });
    } else {
      // Check if product already in cart
      const existingItemIndex = cart.items.findIndex(
        (item) => item.productId.toString() === productId,
      );

      if (existingItemIndex > -1) {
        // Update quantity
        const newQuantity = cart.items[existingItemIndex].quantity + quantity;

        if (product.stock < newQuantity) {
          throw new BadRequestException(
            `Only ${product.stock} items available in stock`,
          );
        }

        cart.items[existingItemIndex].quantity = newQuantity;
        cart.items[existingItemIndex].price = product.price;
      } else {
        // Add new item
        cart.items.push({
          productId: new Types.ObjectId(productId),
          quantity,
          price: product.price,
          addedAt: new Date(),
        } as CartItem);
      }

      await cart.save();
    }

    return this.getCart(userId);
  }

  /**
   * Update item quantity
   */
  async updateItemQuantity(
    userId: string,
    productId: string,
    quantity: number,
  ) {
    if (quantity < 1) {
      return this.removeItem(userId, productId);
    }

    const cart = await this.cartModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId,
    );

    if (itemIndex === -1) {
      throw new NotFoundException('Item not found in cart');
    }

    // Check stock
    const product = await this.productModel.findById(productId);
    if (!product || !product.isActive) {
      throw new NotFoundException('Product not found or inactive');
    }

    if (product.stock < quantity) {
      throw new BadRequestException(
        `Only ${product.stock} items available in stock`,
      );
    }

    cart.items[itemIndex].quantity = quantity;
    cart.items[itemIndex].price = product.price;
    await cart.save();

    return this.getCart(userId);
  }

  /**
   * Remove item from cart
   */
  async removeItem(userId: string, productId: string) {
    const cart = await this.cartModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== productId,
    );

    await cart.save();
    return this.getCart(userId);
  }

  /**
   * Clear cart
   */
  async clearCart(userId: string) {
    await this.cartModel.updateOne(
      { userId: new Types.ObjectId(userId) },
      { items: [] },
    );

    return { message: 'Cart cleared successfully' };
  }

  /**
   * Sync cart from frontend (merge guest cart with user cart)
   */
  async syncCart(userId: string, guestCartItems: any[]) {
    const userCart = await this.cartModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    if (!userCart) {
      // Create cart from guest items
      const validItems = await this.validateCartItems(guestCartItems);
      await this.cartModel.create({
        userId: new Types.ObjectId(userId),
        items: validItems,
      });
    } else {
      // Merge guest cart with user cart
      for (const guestItem of guestCartItems) {
        const product = await this.productModel.findById(guestItem.productId);
        if (!product || !product.isActive || product.stock < 1) {
          continue;
        }

        const existingItemIndex = userCart.items.findIndex(
          (item) => item.productId.toString() === guestItem.productId,
        );

        if (existingItemIndex > -1) {
          // Merge quantities
          const newQuantity =
            userCart.items[existingItemIndex].quantity + guestItem.quantity;
          userCart.items[existingItemIndex].quantity = Math.min(
            newQuantity,
            product.stock,
          );
          userCart.items[existingItemIndex].price = product.price;
        } else {
          // Add guest item
          userCart.items.push({
            productId: new Types.ObjectId(guestItem.productId),
            quantity: Math.min(guestItem.quantity, product.stock),
            price: product.price,
            addedAt: new Date(),
          } as CartItem);
        }
      }

      await userCart.save();
    }

    return this.getCart(userId);
  }

  /**
   * Validate cart items
   */
  private async validateCartItems(items: any[]): Promise<CartItem[]> {
    const validItems: CartItem[] = [];

    for (const item of items) {
      const product = await this.productModel.findById(item.productId);
      if (product && product.isActive && product.stock > 0) {
        validItems.push({
          productId: new Types.ObjectId(item.productId),
          quantity: Math.min(item.quantity, product.stock),
          price: product.price,
          addedAt: new Date(),
        } as CartItem);
      }
    }

    return validItems;
  }

  /**
   * Get cart total
   */
  async getCartTotal(userId: string) {
    const cart = await this.getCart(userId);

    let subtotal = 0;
    let totalItems = 0;

    for (const item of cart.items) {
      const product = item.productId as any;
      if (product) {
        subtotal += item.quantity * item.price;
        totalItems += item.quantity;
      }
    }

    return {
      subtotal,
      totalItems,
      items: cart.items.length,
    };
  }
}
