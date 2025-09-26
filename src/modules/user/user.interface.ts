import { UserRole } from 'src/common/constants';

export interface IUser extends Document {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
}
