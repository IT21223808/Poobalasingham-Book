import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { Reflector } from '@nestjs/core';

import {
  AppPermission,
  ROLE_PERMISSIONS,
} from '../permissions/permissions';

@Injectable()
export class PermissionsGuard
  implements CanActivate
{
  constructor(
    private readonly reflector: Reflector,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean {
    const requiredPermissions =
      this.reflector.getAllAndOverride<
        AppPermission[]
      >('permissions', [
        context.getHandler(),
        context.getClass(),
      ]);

    // No permission requirement
    if (
      !requiredPermissions ||
      requiredPermissions.length === 0
    ) {
      return true;
    }

    const request =
      context.switchToHttp().getRequest();

    const user = request.user;

    if (!user) {
      throw new ForbiddenException(
        'User not authenticated',
      );
    }

    const rolePermissions =
      ROLE_PERMISSIONS[user.role];

    if (!rolePermissions) {
      throw new ForbiddenException(
        'Role does not have any permissions',
      );
    }

    const hasPermission =
      requiredPermissions.some(
        (permission) =>
          rolePermissions.includes(permission),
      );

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to access this resource',
      );
    }

    return true;
  }
}