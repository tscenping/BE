import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import jwtConfig from 'src/config/jwt.config';
import { User } from 'src/users/entities/user.entity';
import { UserRepository } from 'src/users/users.repository';

type JwtPayload = {
	id: number;
};

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy) {
	constructor(
		@InjectRepository(UserRepository)
		private readonly userRepository: UserRepository,
		@Inject(jwtConfig.KEY)
		private readonly jwtConfigure: ConfigType<typeof jwtConfig>,
	) {
		super({
			secretOrKey: jwtConfigure.secret,
			jwtFromRequest: ExtractJwt.fromExtractors([(request) => request.cookies?.accessToken]),
			// jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: true, // 토큰 만료 여부를 검사하지 않는다.
		});
	}

	async validate({ id }: JwtPayload): Promise<User> {
		const user = await this.userRepository.findOneBy({ id });

		if (!user) {
			throw new UnauthorizedException();
		}

		return user;
	}
}
