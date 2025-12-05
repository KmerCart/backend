import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class VendorGuard implements CanActivate {

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

    // Allow all vendor endpoints once user has vendor role
    // Profile creation and other operations will be handled by the service layer
    return true;
  }
}
