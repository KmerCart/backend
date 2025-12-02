import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VendorGuard } from './guards/vendor.guard';
import { VendorsService } from './vendors.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateVendorProfileDto } from './dto/update-vendor-profile.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStatus } from '../orders/schemas/order.schema';

@ApiTags('Vendors')
@Controller('vendors')
@UseGuards(JwtAuthGuard, VendorGuard)
@ApiBearerAuth()
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  // Profile Management
  @Get('profile')
  @ApiOperation({ summary: 'Get vendor profile' })
  @ApiResponse({
    status: 200,
    description: 'Vendor profile retrieved successfully',
  })
  async getProfile(@Request() req) {
    return this.vendorsService.getProfile(req.user.id);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update vendor profile' })
  @ApiResponse({
    status: 200,
    description: 'Vendor profile updated successfully',
  })
  async updateProfile(
    @Request() req,
    @Body() updateProfileDto: UpdateVendorProfileDto,
  ) {
    return this.vendorsService.updateProfile(req.user.id, updateProfileDto);
  }

  // Dashboard Statistics
  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Get vendor dashboard statistics' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics retrieved successfully',
  })
  async getDashboardStats(@Request() req) {
    return this.vendorsService.getDashboardStats(req.user.id);
  }

  @Get('analytics/sales')
  @ApiOperation({ summary: 'Get sales analytics' })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  @ApiResponse({
    status: 200,
    description: 'Sales analytics retrieved successfully',
  })
  async getSalesAnalytics(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.vendorsService.getSalesAnalytics(req.user.id, start, end);
  }

  // Product Management
  @Post('products')
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  async createProduct(
    @Request() req,
    @Body() createProductDto: CreateProductDto,
  ) {
    return this.vendorsService.createProduct(req.user.id, createProductDto);
  }

  @Get('products')
  @ApiOperation({ summary: 'Get all vendor products' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'inactive', 'low-stock', 'out-of-stock'],
  })
  @ApiResponse({
    status: 200,
    description: 'Products retrieved successfully',
  })
  async getProducts(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.vendorsService.getProducts(
      req.user.id,
      page || 1,
      limit || 10,
      search,
      status,
    );
  }

  @Get('products/:id')
  @ApiOperation({ summary: 'Get a single product' })
  @ApiResponse({
    status: 200,
    description: 'Product retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  async getProduct(@Request() req, @Param('id') id: string) {
    return this.vendorsService.getProduct(req.user.id, id);
  }

  @Put('products/:id')
  @ApiOperation({ summary: 'Update a product' })
  @ApiResponse({
    status: 200,
    description: 'Product updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  async updateProduct(
    @Request() req,
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.vendorsService.updateProduct(
      req.user.id,
      id,
      updateProductDto,
    );
  }

  @Delete('products/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a product (soft delete)' })
  @ApiResponse({
    status: 200,
    description: 'Product deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  async deleteProduct(@Request() req, @Param('id') id: string) {
    return this.vendorsService.deleteProduct(req.user.id, id);
  }

  @Patch('products/:id/stock')
  @ApiOperation({ summary: 'Update product stock' })
  @ApiResponse({
    status: 200,
    description: 'Product stock updated successfully',
  })
  async updateProductStock(
    @Request() req,
    @Param('id') id: string,
    @Body('stock') stock: number,
  ) {
    return this.vendorsService.updateProductStock(req.user.id, id, stock);
  }

  // Order Management
  @Get('orders')
  @ApiOperation({ summary: 'Get all vendor orders' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiResponse({
    status: 200,
    description: 'Orders retrieved successfully',
  })
  async getOrders(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: OrderStatus,
  ) {
    return this.vendorsService.getOrders(
      req.user.id,
      page || 1,
      limit || 10,
      status,
    );
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Get a single order' })
  @ApiResponse({
    status: 200,
    description: 'Order retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found',
  })
  async getOrder(@Request() req, @Param('id') id: string) {
    return this.vendorsService.getOrder(req.user.id, id);
  }

  @Patch('orders/:id/status')
  @ApiOperation({ summary: 'Update order status' })
  @ApiResponse({
    status: 200,
    description: 'Order status updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found',
  })
  async updateOrderStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateOrderStatusDto,
  ) {
    return this.vendorsService.updateOrderStatus(
      req.user.id,
      id,
      updateStatusDto,
    );
  }
}
