import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    try {
      const request = context
        .switchToHttp()
        .getRequest();

      console.log(
        '🔎 AUTH HEADER:',
        request.headers.authorization,
      );

      const result = await super.canActivate(
        context,
      );

      console.log('🔐 JWT GUARD RESULT:', result);

      return result as boolean;
    } catch (error) {
      console.error(
        '❌ JWT GUARD ERROR:',
        error,
      );

      throw error;
    }
  }
}