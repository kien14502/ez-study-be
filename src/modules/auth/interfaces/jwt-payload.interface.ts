export interface JwtPayload {
  _id: string;
  sub: string; // userId
  email: string;
  role: string;
  iat: number; // Issued at
  exp: number; // Expires at
  tokenType: 'access' | 'refresh';
  iss: string; // Issuer
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
