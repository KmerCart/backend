import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class VendorGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check if user has vendor role
    if (user.role !== 'vendor') {
      throw new ForbiddenException('Access restricted to vendors only');
    }

    // Allow access to profile endpoint even without vendor profile
    const isProfileEndpoint = request.url?.includes('/vendors/profile');
    const isDashboardStats = request.url?.includes('/vendors/dashboard/stats');

    // If accessing profile endpoint, only check role (allow profile creation/update)
    if (isProfileEndpoint) {
      return true;
    }

    // For dashboard stats, allow even if not approved (just check profile exists)
    if (isDashboardStats) {
      if (!user.vendorProfile) {
        throw new ForbiddenException(
          'Vendor profile not found. Please complete your vendor registration.',
        );
      }
      return true;
    }

    // For all other endpoints, check if vendor profile exists
    if (!user.vendorProfile) {
      throw new ForbiddenException(
        'Vendor profile not found. Please complete your vendor registration.',
      );
    }

    // Approval check removed - vendors can start selling immediately after profile setup

    return true;
  }
}
