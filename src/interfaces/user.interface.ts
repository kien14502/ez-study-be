export interface UserJWTPayload {
  email: string;
  _id: string;
  role: string;
  sub: string;
  iss: string;
}
