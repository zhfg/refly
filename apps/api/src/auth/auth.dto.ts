export interface TokenData {
  accessToken: string;
  refreshToken: string;
}

export interface SendVerificationEmailJobData {
  sessionId: string;
}

export class JwtPayload {
  uid: string;
  email: string;
}
