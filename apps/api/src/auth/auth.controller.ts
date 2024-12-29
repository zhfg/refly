import { Controller, Logger, Get, Post, Res, UseGuards, Body } from '@nestjs/common';
import { Response } from 'express';
import { User as UserModel } from '@prisma/client';

import { User } from '@/utils/decorators/user.decorator';
import { AuthService } from './auth.service';
import { GithubOauthGuard } from './guard/github-oauth.guard';
import { GoogleOauthGuard } from './guard/google-oauth.guard';
import { OAuthError } from '@refly-packages/errors';
import {
  EmailSignupRequest,
  EmailLoginRequest,
  CreateVerificationRequest,
  CheckVerificationRequest,
  CheckVerificationResponse,
  EmailSignupResponse,
  ResendVerificationRequest,
  AuthConfigResponse,
} from '@refly-packages/openapi-schema';
import { buildSuccessResponse } from '@/utils';

@Controller('v1/auth')
export class AuthController {
  private logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}

  @Get('config')
  getAuthConfig(): AuthConfigResponse {
    return buildSuccessResponse(this.authService.getAuthConfig());
  }

  @Post('email/signup')
  async emailSignup(@Body() { email, password }: EmailSignupRequest): Promise<EmailSignupResponse> {
    const { sessionId } = await this.authService.emailSignup(email, password);
    return buildSuccessResponse({ sessionId });
  }

  @Post('email/login')
  async emailLogin(@Body() { email, password }: EmailLoginRequest, @Res() res: Response) {
    const { accessToken } = await this.authService.emailLogin(email, password);
    this.authService.redirect(res, accessToken);
  }

  @Post('verification/create')
  async createVerification(@Body() params: CreateVerificationRequest) {
    const { sessionId } = await this.authService.createVerification(params);
    return buildSuccessResponse({ sessionId });
  }

  @Post('verification/resend')
  async resendVerification(@Body() { sessionId }: ResendVerificationRequest) {
    await this.authService.sendVerificationEmail(sessionId);
    return buildSuccessResponse();
  }

  @Post('verification/check')
  async checkVerification(
    @Body() params: CheckVerificationRequest,
  ): Promise<CheckVerificationResponse> {
    const { verification, accessToken } = await this.authService.checkVerification(params);
    return buildSuccessResponse({ accessToken, purpose: verification.purpose });
  }

  @UseGuards(GithubOauthGuard)
  @Get('github')
  async github() {
    // auth guard will automatically handle this
  }

  @UseGuards(GoogleOauthGuard)
  @Get('google')
  async google() {
    // auth guard will automatically handle this
  }

  @UseGuards(GithubOauthGuard)
  @Get('callback/github')
  async githubAuthCallback(@User() user: UserModel, @Res() res: Response) {
    try {
      this.logger.log(`github oauth callback success, req.user = ${user?.email}`);

      const { accessToken } = await this.authService.login(user);
      this.authService.redirect(res, accessToken);
    } catch (error) {
      this.logger.error('GitHub OAuth callback failed:', error.stack);
      throw new OAuthError();
    }
  }

  @UseGuards(GoogleOauthGuard)
  @Get('callback/google')
  async googleAuthCallback(@User() user: UserModel, @Res() res: Response) {
    try {
      this.logger.log(`google oauth callback success, req.user = ${user?.email}`);

      const { accessToken } = await this.authService.login(user);
      this.authService.redirect(res, accessToken);
    } catch (error) {
      this.logger.error('Google OAuth callback failed:', error.stack);
      throw new OAuthError();
    }
  }
}
