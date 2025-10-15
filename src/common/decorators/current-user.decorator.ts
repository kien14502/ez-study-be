import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { User } from '@/modules/user/user.schema';

export const CurrentUser = createParamDecorator((data: keyof User | undefined, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const user = request.user;
  return data ? user?.[data] : user;
});
