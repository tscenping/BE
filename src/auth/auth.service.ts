import {
	BadRequestException,
	ConflictException,
	Inject,
	Injectable,
	Logger,
	UnauthorizedException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Socket } from 'socket.io';
import * as speakeasy from 'speakeasy';
import jwtConfig from 'src/config/jwt.config';
import userConfig from 'src/config/user.config';
import { User } from 'src/users/entities/user.entity';
import { UsersRepository } from '../users/users.repository';
import { FtUserParamDto } from './dto/ft-user-param.dto';
import { SigninMfaRequestDto } from './dto/signin-mfa-request.dto';
import { UserFindReturnDto } from './dto/user-find-return.dto';

@Injectable()
export class AuthService {
	constructor(
		private readonly usersRepository: UsersRepository,
		private readonly jwtService: JwtService,
		@Inject(jwtConfig.KEY)
		private readonly jwtConfigure: ConfigType<typeof jwtConfig>,
		@Inject(userConfig.KEY)
		private readonly userConfigure: ConfigType<typeof userConfig>,
	) {}

	private readonly logger = new Logger(AuthService.name);

	private async createMfaSecret() {
		const secret = speakeasy.generateSecret({
			name: this.userConfigure.mfaSecret,
		});
		return secret;
	}

	async findOrCreateUser(
		userData: FtUserParamDto,
	): Promise<UserFindReturnDto> {
		const user = await this.usersRepository.findOne({
			where: { email: userData.email },
		});

		if (!user) {
			const user = this.usersRepository.create(userData);
			await this.usersRepository.save(user);

			return { user };
		}

		if (!user.isMfaEnabled) {
			return { user };
		}

		const mfaSecret = await this.createMfaSecret();
		await this.usersRepository.update(user.id, {
			mfaSecret: mfaSecret.base32,
		});

		const mfaUrl = speakeasy.otpauthURL({
			secret: mfaSecret.ascii,
			label: user.email,
			issuer: user.nickname,
		});

		this.logger.log(mfaUrl);

		return { user, mfaUrl };
	}

	async generateJwtToken(user: User) {
		const payload = { id: user.id, email: user.email };
		// accessToken 생성
		const accessToken = await this.jwtService.signAsync(payload);

		// refreshToken 생성
		const refreshToken = await this.jwtService.signAsync({
			id: payload.id,
		});

		// 암호화된 refreshToken을 DB에 저장한다.
		const saltOrRounds = 10;
		const hashedRefreshToken = await bcrypt.hash(
			refreshToken,
			saltOrRounds,
		);
		await this.usersRepository.update(user.id, {
			refreshToken: hashedRefreshToken,
		});

		return { jwtAccessToken: accessToken, jwtRefreshToken: refreshToken };
	}

	async validateNickname(nickname: string) {
		const user = await this.usersRepository.findUserByNickname(nickname);
		if (user) {
			throw new ConflictException('이미 존재하는 닉네임입니다.');
		}
	}

	async getUserFromSocket(client: Socket) {
		const cookie = client.handshake.headers.cookie;
		if (!cookie) {
			this.logger.log('cookie is null');
			return null; // Throw Error 불가. Socket.io에서는 에러를 throw하면 서버가 죽는다.
		}

		const accessToken = cookie.split(';')[0].split('=')[1];
		if (!accessToken) {
			this.logger.log('accessToken is null');
			return null;
		}

		const payload = await this.jwtService.verifyAsync(accessToken, {
			secret: this.jwtConfigure.secret,
		});
		if (!payload) {
			this.logger.log('payload is null');
			return null;
		}
		this.logger.log(`payload: ${JSON.stringify(payload)}`);

		const user = await this.usersRepository.findOne({
			where: { id: payload.id },
		});
		if (!user) {
			this.logger.log('user not found');
			return null;
		}

		return user;
	}

	async generateAccessToken(user: User) {
		const payload = { id: user.id, email: user.email };
		const accessToken = await this.jwtService.signAsync(payload);

		return accessToken;
	}

	async verifyMfa(signinMfaRequestDto: SigninMfaRequestDto) {
		const { userId, token } = signinMfaRequestDto;

		const user = await this.usersRepository.findOne({
			where: { id: userId },
		});

		if (!user) {
			throw new BadRequestException('존재하지 않는 유저입니다.');
		}

		// mfaCode(token) 검증
		const verified = speakeasy.totp.verify({
			secret: user.mfaSecret!,
			encoding: 'base32',
			token,
		});

		if (!verified) {
			throw new UnauthorizedException('MFA 인증에 실패했습니다.');
		}

		// mfaSecret DB에서 삭제
		await this.usersRepository.update(user.id, { mfaSecret: null });

		return user;
	}

	async toggleMfa(user: User) {
		if (user.isMfaEnabled) {
			// MFA 비활성화
			await this.usersRepository.update(user.id, {
				isMfaEnabled: false,
				mfaSecret: null,
			});
		} else {
			// MFA 활성화
			await this.usersRepository.update(user.id, {
				isMfaEnabled: true,
			});
		}
		return !user.isMfaEnabled;
	}
}
