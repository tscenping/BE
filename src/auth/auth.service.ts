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
import { createCipheriv, createDecipheriv } from 'crypto';
import { Socket } from 'socket.io';
import * as speakeasy from 'speakeasy';
import jwtConfig from 'src/config/jwt.config';
import userConfig from 'src/config/user.config';
import { User } from 'src/user-repository/entities/user.entity';
import { UsersRepository } from '../user-repository/users.repository';
import { OauthUserinfoParamDto } from './dto/oauth-userinfo-param.dto';
import { SigninMfaRequestDto } from './dto/signin-mfa-request.dto';
import { UserFindReturnDto } from './dto/user-find-return.dto';
import { UserStatus } from '../common/enum';
import { DBUpdateFailureException } from '../common/exception/custom-exception';

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

	async signup(userId: number, nickname: string, avatar: string) {
		const user = await this.validateUserExist(userId);

		await this.validateUserAlreadySignUp(user);

		await this.validateNickname(nickname);

		const updateRes = await this.usersRepository.update(userId, {
			avatar: avatar,
			nickname: nickname,
			status: UserStatus.ONLINE,
		});

		if (updateRes.affected !== 1) {
			throw DBUpdateFailureException(`user ${userId} update failed`);
		}
	}

	async validateUserExist(userId: number) {
		const user = await this.usersRepository.findOne({
			where: {
				id: userId,
			},
		});

		if (!user) {
			throw new BadRequestException(
				`User with id ${userId} doesn't exist`,
			);
		}
		return user;
	}

	async validateUserAlreadySignUp(user: User) {
		if (user.nickname)
			throw new BadRequestException(`${user.id} is already signed up`);
	}

	async signout(userId: number) {
		await this.usersRepository.update(userId, {
			refreshToken: null,
			status: UserStatus.OFFLINE,
		});
	}

	private async createMfaSecret() {
		const secret = speakeasy.generateSecret({
			name: this.userConfigure.MFA_SECRET,
		});
		return secret;
	}

	async findOrCreateUser(
		userData: OauthUserinfoParamDto,
	): Promise<UserFindReturnDto> {
		const user = await this.usersRepository.findOne({
			where: { email: userData.email },
		});

		if (!user) {
			const user = this.usersRepository.create(userData);
			await this.usersRepository.save(user);

			return { user };
		}

		if (!user.isMfaEnabled || user.mfaSecret) {
			return { user };
		}

		const mfaSecret = await this.createMfaSecret();
		// secret key를 암호화해서 DB에 저장한다.

		// The key length is dependent on the algorithm.
		// In this case for aes256, it is 32 bytes.
		const encryptedMfaSecret = await this.encryptMfaSecret(mfaSecret);

		await this.usersRepository.update(user.id, {
			mfaSecret: encryptedMfaSecret,
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

		// // refreshToken 생성
		// const refreshToken = await this.jwtService.signAsync({
		// 	id: payload.id,
		// });

		// // 암호화된 refreshToken을 DB에 저장한다.
		// const saltOrRounds = 10;
		// const hashedRefreshToken = await bcrypt.hash(
		// 	refreshToken,
		// 	saltOrRounds,
		// );
		// await this.usersRepository.update(user.id, {
		// 	refreshToken: hashedRefreshToken,
		// });

		return accessToken;
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
		// this.logger.log(`payload: ${JSON.stringify(payload)}`);

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
		if (!user.mfaSecret) {
			throw new BadRequestException('MFA가 활성화되어 있지 않습니다.');
		}

		// mfaCode(token) 검증
		const decryptedMfaSecret = await this.decryptMfaSecret(user.mfaSecret);
		const verified = speakeasy.totp.verify({
			secret: decryptedMfaSecret,
			encoding: 'ascii',
			token,
		});

		if (!verified) {
			throw new UnauthorizedException('MFA 인증에 실패했습니다.');
		}

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

	async encryptMfaSecret(mfaSecret: speakeasy.GeneratedSecret) {
		const cipher = createCipheriv(
			'aes-256-ctr',
			this.userConfigure.CRYPTO_KEY,
			this.userConfigure.CRYPTO_SECRET_IV,
		);

		const encryptedMfaSecret = Buffer.concat([
			cipher.update(mfaSecret.ascii),
			cipher.final(),
		]).toString('hex');

		return encryptedMfaSecret;
	}

	async decryptMfaSecret(encryptedMfaSecret: string) {
		const decipher = createDecipheriv(
			'aes-256-ctr',
			this.userConfigure.CRYPTO_KEY,
			this.userConfigure.CRYPTO_SECRET_IV,
		);
		// string to buffer
		const encryptedBuffer = Buffer.from(encryptedMfaSecret, 'hex');
		const decryptedMfaSecret = Buffer.concat([
			decipher.update(encryptedBuffer),
			decipher.final(),
		]);
		return decryptedMfaSecret.toString();
	}
}
