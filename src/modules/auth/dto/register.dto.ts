import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
  IsEnum,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from '../../users/schemas/user.schema';

class BankAccountDto {
  @ApiProperty({ example: '1234567890' })
  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @ApiProperty({ example: '987654321' })
  @IsString()
  @IsNotEmpty()
  routingNumber: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  accountHolderName: string;
}

class AddressDto {
  @ApiProperty({ example: '123 Main Street' })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({ example: 'Douala' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'Littoral' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({ example: '12345' })
  @IsString()
  @IsNotEmpty()
  zipCode: string;

  @ApiProperty({ example: 'Cameroon' })
  @IsString()
  @IsNotEmpty()
  country: string;
}

class VendorProfileDto {
  @ApiProperty({ example: 'TechStore Premium' })
  @IsString()
  @IsNotEmpty()
  businessName: string;

  @ApiProperty({ example: 'Premium electronics and gadgets' })
  @IsString()
  @IsNotEmpty()
  businessDescription: string;

  @ApiProperty({ type: AddressDto })
  @ValidateNested()
  @Type(() => AddressDto)
  businessAddress: AddressDto;

  @ApiProperty({ example: 'TAX-123456' })
  @IsString()
  @IsNotEmpty()
  taxId: string;

  @ApiProperty({ type: BankAccountDto })
  @ValidateNested()
  @Type(() => BankAccountDto)
  bankAccount: BankAccountDto;
}

export class RegisterDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  password: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  lastName: string;

  @ApiProperty({ enum: UserRole, example: UserRole.CUSTOMER })
  @IsEnum(UserRole, { message: 'Role must be either customer, vendor, or admin' })
  @IsOptional()
  role?: UserRole;

  @ApiProperty({ type: VendorProfileDto, required: false })
  @ValidateNested()
  @Type(() => VendorProfileDto)
  @IsOptional()
  vendorProfile?: VendorProfileDto;

  @ApiProperty({ example: '+237123456789', required: false })
  @IsString()
  @IsOptional()
  phone?: string;
}
