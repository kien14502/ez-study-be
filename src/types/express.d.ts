// types/express.d.ts
import { User } from '../modules/user/user.schema';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
