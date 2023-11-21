import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import userConfig from 'src/config/user.config';
import { User } from 'src/users/entities/user.entity';
import { UsersRepository } from './../users/users.repository';
import { UserFindReturnDto } from './dto/user-find-return.dto';
import { FtUserParamDto } from './dto/ft-user-param.dto';

@Injectable()
export class AuthService {
	private readonly nicknamePrefix: string;

	constructor(
		private readonly userRepository: UsersRepository,
		private readonly jwtService: JwtService,
		@Inject(userConfig.KEY)
		private readonly userConfigure: ConfigType<typeof userConfig>,
	) {
		this.nicknamePrefix = this.userConfigure.FIRST_NICKNAME_PREFIX;
	}

	private async createMfaCode(): Promise<string> {
		return Promise.resolve('mfaCode'); // TODO: 2FA 코드 생성
	}

	async findOrCreateUser(
		userData: FtUserParamDto,
	): Promise<UserFindReturnDto> {
		const user = await this.userRepository.findOne({
			where: { email: userData.email },
		});

		if (!user) {
			const user = this.userRepository.create(userData);
			user.nickname = this.nicknamePrefix + userData.nickname;
			await this.userRepository.save(user);

			return { user };
		}

		if (!user.isMfaEnabled) {
			return { user };
		}

		const mfaCode = await this.createMfaCode();
		return { user, mfaCode };
	}

	async generateJwtToken(user: User) {
		const payload = { id: user.id };
		// accessToken 생성
		const accessToken = await this.jwtService.signAsync(payload);

		// refreshToken 생성
		const refreshToken = await this.jwtService.signAsync({
			id: payload.id,
		});

		// refreshToken을 DB에 저장한다.
		await this.userRepository.update(user.id, { refreshToken });

		return { jwtAccessToken: accessToken, jwtRefreshToken: refreshToken };
	}

	async validateNickname(nickname: string) {
		const user = await this.userRepository.findOneByNickname(nickname);
		if (user) {
			throw new HttpException(
				'이미 존재하는 닉네임입니다.',
				HttpStatus.CONFLICT,
			);
		}
	}
}
