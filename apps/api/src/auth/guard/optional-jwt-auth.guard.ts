import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ACCESS_TOKEN_COOKIE } from '@refly-packages/utils';

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(OptionalJwtAuthGuard.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromRequest(request);

    if (!token) {
      // If no token is present, allow the request but set user as null
      request.user = null;
      return true;
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('auth.jwt.secret'),
      });
      request.user = payload;
    } catch (error) {
      this.logger.warn(`jwt verify not valid: ${error}`);
      // If token is invalid, allow the request but set user as null
      request.user = null;
    }
    return true;
  }

  private extractTokenFromRequest(request: Request): string | undefined {
    // Try to get token from Authorization header
    const authHeader = request.headers?.authorization;
    if (authHeader) {
      const [type, token] = authHeader.split(' ');
      if (type === 'Bearer') {
        return token;
      }
    }

    // Try to get token from cookie
    const token = request.cookies?.[ACCESS_TOKEN_COOKIE];
    if (token) {
      return token;
    }

    return undefined;
  }
}
