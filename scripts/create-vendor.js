/**
 * Quick script to create a vendor user for testing
 * Usage: node scripts/create-vendor.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kmercart';

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  firstName: String,
  lastName: String,
  role: String,
  isActive: Boolean,
  isEmailVerified: Boolean,
  vendorProfile: {
    businessName: String,
    businessDescription: String,
    taxId: String,
    isApproved: Boolean,
    businessAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
  },
  createdAt: Date,
  updatedAt: Date,
});

async function createVendor() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully!');

    const User = mongoose.model('User', userSchema);

    // Vendor credentials
    const vendorEmail = 'vendor@test.com';
    const vendorPassword = 'vendor123';

    // Check if vendor already exists
    const existingVendor = await User.findOne({ email: vendorEmail });
    if (existingVendor) {
      console.log('\n✅ Vendor already exists!');
      console.log('Email:', vendorEmail);
      console.log('Password:', vendorPassword);
      console.log('\nVendor Profile:', existingVendor.vendorProfile || 'Not set up yet');

      // Update to ensure profile exists
      if (!existingVendor.vendorProfile) {
        existingVendor.vendorProfile = {
          businessName: 'Test Electronics Store',
          businessDescription: 'Premium electronics and gadgets',
          taxId: 'TAX123456789',
          isApproved: true,
        };
        existingVendor.role = 'vendor';
        await existingVendor.save();
        console.log('\n✅ Vendor profile added!');
      }

      await mongoose.connection.close();
      return;
    }

    // Hash password
    console.log('\nCreating vendor user...');
    const hashedPassword = await bcrypt.hash(vendorPassword, 10);

    // Create vendor user with profile
    const vendor = await User.create({
      email: vendorEmail,
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Vendor',
      role: 'vendor',
      isActive: true,
      isEmailVerified: true,
      vendorProfile: {
        businessName: 'Test Electronics Store',
        businessDescription: 'Premium electronics and gadgets',
        taxId: 'TAX123456789',
        isApproved: true,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log('\n✅ Vendor created successfully!');
    console.log('\n📧 Login Credentials:');
    console.log('Email:', vendorEmail);
    console.log('Password:', vendorPassword);
    console.log('\n🏪 Business:', vendor.vendorProfile.businessName);
    console.log('Status: Approved ✅');
    console.log('\n🚀 You can now login at: http://localhost:3000/login');

    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
  } catch (error) {
    console.error('Error creating vendor:', error);
    process.exit(1);
  }
}

createVendor();
