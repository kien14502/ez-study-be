import { OmitType } from '@nestjs/swagger';

import { User } from '../schemas/user.schema';

export class UpdateProfileDto extends OmitType(User, [
  '_id',
  'accountId',
  'role',
  'workspaceId',
  'createdAt',
  'updatedAt',
  'deletedAt',
] as const) {}
