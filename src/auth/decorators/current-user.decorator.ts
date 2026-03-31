import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IAccessTokenPayload } from 'src/common/interfaces/auth.interface';

export const CurrentUser = createParamDecorator<
  keyof IAccessTokenPayload | undefined
>((data, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest<{
    user?: IAccessTokenPayload;
  }>();
  const user = req.user;

  return data ? user?.[data] : user;
});
