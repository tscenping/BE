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

// @Injectable()
// export class JwtAuthGuard extends PassportStrategy(Strategy, 'access') {
// 	constructor(
// 		@InjectRepository(UsersRepository)
// 		private readonly userRepository: UsersRepository,
// 		@Inject(jwtConfig.KEY)
// 		private readonly jwtConfigure: ConfigType<typeof jwtConfig>,
// 	) {
// 		super({
// 			secretOrKey: jwtConfigure.secret,
// 			jwtFromRequest: ExtractJwt.fromExtractors([
// 				(request) => request.cookies?.accessToken,
// 			]),
// 			// ignoreExpiration: true,
// 		});
// 	}

// 	async validate({ id }: JwtAccessPayloadDto): Promise<User> {
// 		console.log('jwt-auth.guard.ts: validate: id: ', id);
// 		const user = await this.userRepository.findOneBy({ id });

// 		if (!user) {
// 			throw new UnauthorizedException();
// 		}

// 		return user;
// 	}
// }
