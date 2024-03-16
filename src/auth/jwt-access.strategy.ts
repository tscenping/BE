import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import jwtConfig from 'src/config/jwt.config';
import { User } from 'src/user-repository/entities/user.entity';
import { UsersRepository } from 'src/user-repository/users.repository';
import { JwtAccessPayloadDto } from './dto/jwt-access-payload.dto';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'access') {
	constructor(
		@InjectRepository(UsersRepository)
		private readonly userRepository: UsersRepository,
		@Inject(jwtConfig.KEY)
		private readonly jwtConfigure: ConfigType<typeof jwtConfig>,
	) {
		super({
			secretOrKey: jwtConfigure.secret,
			jwtFromRequest: ExtractJwt.fromExtractors([
				(request) => request.cookies?.accessToken,
			]),
			ignoreExpiration: true, // 토큰 만료 여부를 검사하지 않는다.
		});
	}

	async validate({ id }: JwtAccessPayloadDto): Promise<User> {
		const user = await this.userRepository.findOne({
			where: { id },
		});

		if (!user) {
			throw new UnauthorizedException();
		}

		return user;
	}
}
