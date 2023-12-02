import { Body, Controller, Patch, Post, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { User } from 'src/users/entities/user.entity';
import { SignupRequestDto } from '../users/dto/signup-request.dto';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { UserSigninResponseDto } from './dto/user-signin-response.dto';
import { FtAuthService } from './ft-auth.service';
import { GetUser } from './get-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
	constructor(
		private readonly authService: AuthService,
		private readonly ftAuthService: FtAuthService,
		private readonly usersService: UsersService,
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
		const { user, mfaCode } = await this.authService.findOrCreateUser(
			userData,
		);

		// 사용자 정보를 이용해 JWT 토큰을 생성한다.
		const { jwtAccessToken, jwtRefreshToken } =
			await this.authService.generateJwtToken(user);

		// token을 쿠키에 저장한다.
		res.cookie('accessToken', jwtAccessToken, {
			// httpOnly: true,	// 자동로그인을 위해 httpOnly를 false로 설정
			secure: true,
			sameSite: 'none',
			expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1),
		});

		res.cookie('refreshToken', jwtRefreshToken, {
			httpOnly: true,
			secure: true,
			sameSite: 'none',
			expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1),
		});

		const userSigninResponseDto: UserSigninResponseDto = {
			userId: user.id,
			isFirstLogin: user.nickname === null,
			isMfaEnabled: user.isMfaEnabled,
			mfaCode,
		};

		return res.send(userSigninResponseDto);
	}

	@Patch('/signup')
	@ApiOperation({
		summary: '회원가입',
		description:
			'이미 존재하는 유저인지 체크하고, 유저상태(status)를 online으로 업데이트 합니다',
	})
	@UseGuards(JwtAuthGuard)
	async signup(
		@GetUser() user: User,
		@Body() signupRequestDto: SignupRequestDto,
	) {
		const nickname = signupRequestDto.nickname;
		const avatar = signupRequestDto.avatar;

		await this.usersService.signup(user.id, nickname, avatar);
	}

	// TODO: 테스트용 코드. 추후 삭제
	@Post('/test/signin')
	@ApiOperation({
		summary: '테스트용 계정 생성',
		description: '테스트용 계정 생성',
	})
	@ApiResponse({ status: 201, description: '토큰 발급 성공' })
	async testSignIn(@Body('nickname') nickname: string, @Res() res: Response) {
		const existUser = await this.usersService.findUserByNickname(nickname);
		if (existUser) {
			const { jwtAccessToken, jwtRefreshToken } =
				await this.authService.generateJwtToken(existUser);
			// token을 쿠키에 저장한다.
			res.cookie('accessToken', jwtAccessToken, {
				// httpOnly: true,	// 자동로그인을 위해 httpOnly를 false로 설정
				secure: true,
				sameSite: 'none',
				expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1),
			});

			res.cookie('refreshToken', jwtRefreshToken, {
				httpOnly: true,
				secure: true,
				sameSite: 'none',
				expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1),
			});

			const userSigninResponseDto: UserSigninResponseDto = {
				userId: existUser.id,
				isFirstLogin: false,
				isMfaEnabled: false,
				mfaCode: undefined,
			};

			return res.send(userSigninResponseDto);
		}

		const user = await this.usersService.createUser(nickname, 'test@test');

		const { jwtAccessToken, jwtRefreshToken } =
			await this.authService.generateJwtToken(user);

		// token을 쿠키에 저장한다.
		res.cookie('accessToken', jwtAccessToken, {
			// httpOnly: true,
			secure: true,
			sameSite: 'none',
			expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1), // 1일
		});

		res.cookie('refreshToken', jwtRefreshToken, {
			httpOnly: true,
			secure: true,
			sameSite: 'none',
			expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1),
		});

		const userSigninResponseDto: UserSigninResponseDto = {
			userId: user.id,
			isFirstLogin: false,
			isMfaEnabled: false,
			mfaCode: undefined,
		};

		return res.send(userSigninResponseDto);
	}

	@Patch('/signout')
	@ApiOperation({
		summary: '쿠키삭제',
		description:
			'200 OK 만 반환한다. 쿠키에 있는 access,refresh token를 지운다.',
	})
	@UseGuards(JwtAuthGuard)
	async signout(@GetUser() user: User, @Res() res: Response) {
		await this.usersService.signout(user.id);

		// TODO: 해당 유저의 상태 변경을 알리는 소켓 이벤트 전송

		res.clearCookie('accessToken');
		res.clearCookie('refreshToken');
		return res.send();
	}
}
