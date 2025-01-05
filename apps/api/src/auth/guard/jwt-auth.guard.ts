import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedError } from '@refly-packages/errors';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService, private configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromRequest(request);
    if (!token) {
      throw new UnauthorizedError();
    }
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('auth.jwt.secret'),
      });

      // 💡 We're assigning the payload to the request object here
      // so that we can access it in our route handlers
      request['user'] = payload;
    } catch {
      throw new UnauthorizedError();
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
    const sid = request.cookies?._refly_ai_sid;
    if (sid) {
      return sid;
    }

    return undefined;
  }
}
