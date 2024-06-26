import { Body, Controller, Patch, Post, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { User } from 'src/user-repository/entities/user.entity';
import { SignupRequestDto } from './dto/signup-request.dto';
import { AuthService } from './auth.service';
import { SigninMfaRequestDto } from './dto/signin-mfa-request.dto';
import { UserSigninResponseDto } from './dto/user-signin-response.dto';
import { FtAuthService } from './ft-auth.service';
import { GetUser } from './get-user.decorator';
import { UsersRepository } from '../user-repository/users.repository';
import { GoogleAuthService } from './google-auth.service';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
	constructor(
		private readonly authService: AuthService,
		private readonly ftAuthService: FtAuthService,
		private readonly googleAuthService: GoogleAuthService,
		private readonly usersRepository: UsersRepository,
	) {}

	@Post('/signin')
	@ApiOperation({
		summary: '토큰을 발급받는다.',
		description:
			'처음 사이트에 들어와서 DB에 저장되는 유저면 명시해줘야 한다. 닉네임, 아바타 수정 화면을 프론트에서 띄워줄 수 있음. avatar랑 nickname이 null이라면 첫 가입이다.',
	})
	@ApiResponse({ status: 200, description: '토큰 발급 성공' })
	async signin(@Body('code') code: string, @Res() res: Response) {
		// code를 이용해 access token을 받아온다.
		const accessToken = await this.ftAuthService.getAccessToken(code);
		// access token을 이용해 사용자 정보를 받아온다.
		const userData = await this.ftAuthService.getUserData(accessToken);
		// 신규가입자라면 DB에 저장한다.
		const { user, mfaUrl } = await this.authService.findOrCreateUser(
			userData,
		);

		// 사용자 정보를 이용해 JWT 토큰을 생성한다.
		const jwtAccessToken = await this.authService.generateJwtToken(user);

		// MFA가 활성화 되어있지 않다면 jwt 토큰을 쿠키에 저장한다.
		if (user.isMfaEnabled == false) {
			// token을 쿠키에 저장한다.
			res.cookie('accessToken', jwtAccessToken, {
				httpOnly: false,	// 자동로그인을 위해 httpOnly를 false로 설정
				secure: true,
				sameSite: 'lax',
				domain: 'tscenping.shop',
				expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1),
			});
		}

		const userSigninResponseDto: UserSigninResponseDto = {
			userId: user.id,
			nickname: user.nickname,
			isFirstLogin: user.nickname === null,
			isMfaEnabled: user.isMfaEnabled,
			mfaUrl,
		};

		return res.send(userSigninResponseDto);
	}

	@Post('/signin-google')
	async signinGoogle(@Body('code') code: any, @Res() res: Response) {
		console.log('google code: ', code);

		const accessToken = await this.googleAuthService.getAccessToken(code);
		const userData = await this.googleAuthService.getUserData(accessToken);
		const { user, mfaUrl } = await this.authService.findOrCreateUser(
			userData,
		);

		const jwtAccessToken = await this.authService.generateJwtToken(user);

		if (user.isMfaEnabled == false) {
			// token을 쿠키에 저장한다.
			res.cookie('accessToken', jwtAccessToken, {
				httpOnly: false,	// 자동로그인을 위해 httpOnly를 false로 설정
				secure: true,
				sameSite: "lax",
				domain: 'tscenping.shop',
				expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1),
			});
		}

		const userSigninResponseDto: UserSigninResponseDto = {
			userId: user.id,
			nickname: user.nickname,
			isFirstLogin: user.nickname === null,
			isMfaEnabled: user.isMfaEnabled,
			mfaUrl,
		};

		return res.send(userSigninResponseDto);
	}

	@Patch('/signup')
	@ApiOperation({
		summary: '회원가입',
		description:
			'이미 존재하는 유저인지 체크하고, 유저상태(status)를 online으로 업데이트 합니다',
	})
	@UseGuards(AuthGuard('access'))
	async signup(
		@GetUser() user: User,
		@Body() signupRequestDto: SignupRequestDto,
	) {
		const nickname = signupRequestDto.nickname;
		const avatar = signupRequestDto.avatar;

		const preSignedUrl = await this.authService.signup(
			user.id,
			nickname,
			avatar,
		);

		return { preSignedUrl: preSignedUrl };
	}

	// TODO: 테스트용 코드. 추후 삭제
	@Post('/test/signin')
	@ApiOperation({
		summary: '테스트용 계정 생성',
		description: '테스트용 계정 생성',
	})
	@ApiParam({
		name: 'nickname',
		description:
			'테스트용 닉네임. 이미 존재하는 닉네임이면 해당 유저의 정보를 반환한다.',
	})
	@ApiResponse({ status: 201, description: '토큰 발급 성공' })
	async testSignIn(@Body('nickname') nickname: string, @Res() res: Response) {
		// 이미 존재하는 유저인지 확인한다.
		const existUser = await this.usersRepository.findUserByNickname(
			nickname,
		);
		// 이미 존재하는 유저라면 토큰을 발급한다.
		if (existUser) {
			const jwtAccessToken = await this.authService.generateJwtToken(
				existUser,
			);
			// token을 쿠키에 저장한다.
			res.cookie('accessToken', jwtAccessToken, {
				httpOnly: false,	// 자동로그인을 위해 httpOnly를 false로 설정
				secure: true,
				sameSite: "lax",
				domain: 'tscenping.shop',
				expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1),
			});

			// res.cookie('refreshToken', jwtRefreshToken, {
			// 	httpOnly: true,
			// 	secure: true,
			// 	sameSite: 'none',
			// 	expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1),
			// });

			const userSigninResponseDto: UserSigninResponseDto = {
				userId: existUser.id,
				nickname: existUser.nickname,
				isFirstLogin: false,
				isMfaEnabled: false,
				mfaUrl: undefined,
			};

			return res.send(userSigninResponseDto);
		}

		const user = await this.usersRepository.createUser(
			nickname,
			'test@test',
		);

		const jwtAccessToken = await this.authService.generateJwtToken(user);

		// token을 쿠키에 저장한다.
		res.cookie('accessToken', jwtAccessToken, {
			httpOnly: false,
			secure: true,
			sameSite: "lax",
			domain: 'tscenping.shop',
			expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1), // 1일
		});

		// res.cookie('refreshToken', jwtRefreshToken, {
		// 	httpOnly: true,
		// 	secure: true,
		// 	sameSite: 'none',
		// 	expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14), // 14일
		// });

		const userSigninResponseDto: UserSigninResponseDto = {
			userId: user.id,
			nickname: user.nickname,
			isFirstLogin: false,
			isMfaEnabled: false,
			mfaUrl: undefined,
		};

		return res.send(userSigninResponseDto);
	}

	@Patch('/signout')
	@ApiOperation({
		summary: '쿠키삭제',
		description:
			'200 OK 만 반환한다. 쿠키에 있는 access,refresh token를 지운다.',
	})
	@UseGuards(AuthGuard('access'))
	async signout(@GetUser() user: User, @Res() res: Response) {
		await this.authService.signout(user.id);

		res.clearCookie('accessToken');
		res.clearCookie('refreshToken');

		// logout 시에는 프론트가 소켓을 disconnect 해준다.
		return res.send();
	}

	@Patch('/refresh')
	@ApiOperation({
		summary: 'jwt access 토큰 재발급',
		description: `jwt access 토큰 재발급.
			refresh token이 유효하지 않으면 401 Unauthorized`,
	})
	@UseGuards(AuthGuard('refresh'))
	async refresh(@GetUser() user: User, @Res() res: Response) {
		const jwtAccessToken = await this.authService.generateAccessToken(user);
		res.cookie('accessToken', jwtAccessToken, {
			httpOnly: false,
			secure: true,
			sameSite: "lax",
			domain: 'tscenping.shop',
			expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1), // 1일
		});

		return res.send();
	}

	@Patch('/signin/mfa')
	@ApiOperation({
		summary: 'MFA 인증',
		description: 'MFA 인증',
	})
	@ApiResponse({ status: 200, description: 'MFA 인증 성공' })
	async signinMfa(
		@Body() signinMfaRequestDto: SigninMfaRequestDto,
		@Res() res: Response,
	) {
		// MFA 인증
		const user = await this.authService.verifyMfa(signinMfaRequestDto);

		// 사용자 정보를 이용해 JWT 토큰을 생성한다.
		const jwtAccessToken = await this.authService.generateJwtToken(user);

		// token을 쿠키에 저장한다.
		res.cookie('accessToken', jwtAccessToken, {
			httpOnly: false,
			secure: true,
			sameSite: "lax",
			domain: 'tscenping.shop',
			expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1), // 1일
		});

		return res.send();
	}

	@Patch('/mfa')
	@ApiOperation({
		summary: 'MFA 활성화/비활성화',
		description: 'MFA 활성화/비활성화',
	})
	@ApiResponse({ status: 200, description: 'MFA 활성화/비활성화 결과' })
	@UseGuards(AuthGuard('access'))
	async toggleMfa(@GetUser() user: User) {
		const isMfaEnabled = await this.authService.toggleMfa(user);
		return { isMfaEnabled };
	}
}
