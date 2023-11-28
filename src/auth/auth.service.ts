import { ConflictException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/users/entities/user.entity';
import { UsersRepository } from '../users/users.repository';
import { FtUserParamDto } from './dto/ft-user-param.dto';
import { UserFindReturnDto } from './dto/user-find-return.dto';

@Injectable()
export class AuthService {
	constructor(
		private readonly userRepository: UsersRepository,
		private readonly jwtService: JwtService,
	) {}

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
		const user = await this.userRepository.findUserByNickname(nickname);
		if (user) {
			throw new ConflictException('이미 존재하는 닉네임입니다.');
		}
	}
}
