import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../modules/users/schemas/user.schema';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userModel = app.get<Model<User>>(getModelToken(User.name));

  console.log('🌱 Creating test accounts...\n');

  // Test accounts data
  const testAccounts = [
    {
      email: 'customer@test.com',
      password: 'Password123!',
      firstName: 'John',
      lastName: 'Customer',
      role: UserRole.CUSTOMER,
    },
    {
      email: 'vendor@test.com',
      password: 'Password123!',
      firstName: 'Jane',
      lastName: 'Vendor',
      role: UserRole.VENDOR,
      vendorProfile: {
        businessName: 'TechStore Premium',
        businessDescription: 'Premium electronics and gadgets',
        businessAddress: {
          street: '123 Business Street',
          city: 'Douala',
          state: 'Littoral',
          zipCode: '12345',
          country: 'Cameroon',
        },
        taxId: 'TAX-123456',
        bankAccount: {
          accountNumber: '1234567890',
          routingNumber: '987654321',
          accountHolderName: 'Jane Vendor',
        },
        commissionRate: 0.15,
        isApproved: true,
        rating: 4.8,
        totalSales: 0,
        joinedDate: new Date(),
      },
    },
    {
      email: 'admin@test.com',
      password: 'Password123!',
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
    },
  ];

  for (const account of testAccounts) {
    try {
      // Check if user already exists
      const existingUser = await userModel.findOne({ email: account.email });

      if (existingUser) {
        console.log(`⏭️  Skipping ${account.role}: ${account.email} (already exists)`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(account.password, 10);

      // Create user
      await userModel.create({
        ...account,
        password: hashedPassword,
        isEmailVerified: true,
        isActive: true,
      });

      console.log(`✅ Created ${account.role}: ${account.email}`);
      console.log(`   Password: ${account.password}`);
      console.log(`   Name: ${account.firstName} ${account.lastName}\n`);
    } catch (error) {
      console.error(`❌ Error creating ${account.role} account:`, error.message);
    }
  }

  console.log('\n🎉 Test accounts creation completed!\n');
  console.log('📝 Login credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Customer Account:');
  console.log('  Email: customer@test.com');
  console.log('  Password: Password123!');
  console.log('');
  console.log('Vendor Account:');
  console.log('  Email: vendor@test.com');
  console.log('  Password: Password123!');
  console.log('  Business: TechStore Premium');
  console.log('');
  console.log('Admin Account:');
  console.log('  Email: admin@test.com');
  console.log('  Password: Password123!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  await app.close();
  process.exit(0);
}

bootstrap().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
