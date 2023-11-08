import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // console.log('----------------JwtAuthGuard----------------');
    // // console.log('context:', context);
    // console.log(context.switchToHttp().getRequest());
    return super.canActivate(context);
  }
}
