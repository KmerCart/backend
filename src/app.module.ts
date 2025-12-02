import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
// import { ProductsModule } from './modules/products/products.module';
// import { CategoriesModule } from './modules/categories/categories.module';
// import { CartModule } from './modules/cart/cart.module';
// import { OrdersModule } from './modules/orders/orders.module';
// import { ReviewsModule } from './modules/reviews/reviews.module';
import { VendorsModule } from './modules/vendors/vendors.module';
import { UploadModule } from './modules/upload/upload.module';
// import { PayoutsModule } from './modules/payouts/payouts.module';
// import { NotificationsModule } from './modules/notifications/notifications.module';
// import { PaymentsModule } from './modules/payments/payments.module';
// import { AnalyticsModule } from './modules/analytics/analytics.module';
import { LoggerModule } from './common/logger/logger.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        retryWrites: true,
        w: 'majority',
      }),
      inject: [ConfigService],
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get('THROTTLE_TTL') || 60,
          limit: configService.get('THROTTLE_LIMIT') || 100,
        },
      ],
      inject: [ConfigService],
    }),

    // Logging
    LoggerModule,

    // Feature modules
    AuthModule,
    UsersModule,
    VendorsModule,
    UploadModule,
    // ProductsModule,
    // CategoriesModule,
    // CartModule,
    // OrdersModule,
    // ReviewsModule,
    // PayoutsModule,
    // NotificationsModule,
    // PaymentsModule,
    // AnalyticsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
