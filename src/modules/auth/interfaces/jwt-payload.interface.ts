export interface JwtPayload {
  sub: string; // userId
  email: string;
  role: string;
  iat: number; // Issued at
  exp: number; // Expires at
  tokenType: 'access' | 'refresh';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
