export interface UserJWTPayload {
  email: string;
  _id: string;
  sub: string;
  iss: string;
}

export interface UserRegisterEmail {
  email: string;
  fullName: string;
}
