import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import jwtConfig from 'src/config/jwt.config';
import { User } from 'src/user-repository/entities/user.entity';
import { UsersRepository } from 'src/user-repository/users.repository';
import { JwtRefreshPayloadDto } from './dto/jwt-refresh-payload.dto';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'refresh') {
	constructor(
		@InjectRepository(UsersRepository)
		private readonly usersRepository: UsersRepository,
		@Inject(jwtConfig.KEY)
		private readonly jwtConfigure: ConfigType<typeof jwtConfig>,
	) {
		super({
			secretOrKey: jwtConfigure.secret,
			jwtFromRequest: ExtractJwt.fromExtractors([
				(request) => request.cookies?.refreshToken,
			]),
			passReqToCallback: true, // req를 validate 콜백함수에 전달
		});
	}

	async validate(req: Request, payload: JwtRefreshPayloadDto): Promise<User> {
		const refreshToken = req.cookies?.refreshToken;
		const user = await this.usersRepository.findOne({
			where: { id: payload.id },
		});

		if (!user) {
			console.log(`Invalid user`);
			throw new UnauthorizedException();
		}

		console.log(`user.refreshToken: ${user.refreshToken}`);
		console.log(`refreshToken: ${refreshToken}`);

		if (!user.refreshToken || !refreshToken) {
			throw new UnauthorizedException();
		}

		const isRefreshTokenValid = await bcrypt.compare(
			refreshToken,
			user.refreshToken,
		);

		if (!isRefreshTokenValid) {
			console.log(`token match failed`);
			throw new UnauthorizedException();
		}

		console.log('jwt-refresh.strategy.ts: validate: user: ', user);
		return user;
	}
}
