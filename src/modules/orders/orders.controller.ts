import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto';
import { OrderStatus } from './schemas/order.schema';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create order from cart' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  async createOrder(@Request() req, @Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.createOrder(req.user.id, createOrderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get user orders' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  async getOrders(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: OrderStatus,
  ) {
    if (req.user.role === 'vendor') {
      return this.ordersService.getVendorOrders(
        req.user.id,
        page,
        limit,
        status,
      );
    }
    return this.ordersService.getCustomerOrders(
      req.user.id,
      page,
      limit,
      status,
    );
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get order statistics (vendor only)' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved' })
  async getOrderStats(@Request() req) {
    if (req.user.role !== 'vendor') {
      return { message: 'Not available for customers' };
    }
    return this.ordersService.getVendorOrderStats(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single order' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  async getOrder(@Request() req, @Param('id') id: string) {
    return this.ordersService.getOrder(id, req.user.id, req.user.role);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status (vendor only)' })
  @ApiResponse({ status: 200, description: 'Order status updated' })
  async updateOrderStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatus(
      id,
      req.user.id,
      updateStatusDto.status,
      updateStatusDto.note,
    );
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel order (customer only)' })
  @ApiResponse({ status: 200, description: 'Order cancelled successfully' })
  async cancelOrder(
    @Request() req,
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    return this.ordersService.cancelOrder(id, req.user.id, reason);
  }
}
