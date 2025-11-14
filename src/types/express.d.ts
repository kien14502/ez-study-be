// types/express.d.ts
import { UserJWTPayload } from 'src/interfaces/user.interface';

declare global {
  namespace Express {
    interface Request {
      user?: UserJWTPayload;
      id: string;
    }
  }
}
