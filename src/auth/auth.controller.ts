import {
  Body,
  Controller,
  Inject,
  Logger,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Response } from 'express';
import userConfig from 'src/config/user.config';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { UserSigninResponseDto } from './dto/user-signin-response.dto';
import { FtAuthService } from './ft-auth.service';
import { GetUser } from './get-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginRequestDto } from '../users/dto/login-request.dto';

@Controller('auth')
export class AuthController {
  private readonly nicknamePrefix: string;

  constructor(
    private readonly authService: AuthService,
    private readonly ftAuthService: FtAuthService,
    private readonly usersService: UsersService,
    @Inject(userConfig.KEY)
    private readonly userConfigure: ConfigType<typeof userConfig>,
  ) {
    this.nicknamePrefix = this.userConfigure.FIRST_NICKNAME_PREFIX;
  }
  private readonly logger = new Logger(AuthController.name);

  @Post('/signin')
  async signin(@Body('code') code: string, @Res() res: Response) {
    // code를 이용해 access token을 받아온다.
    const accessToken = await this.ftAuthService.getAccessToken(code);
    // access token을 이용해 사용자 정보를 받아온다.
    const userData = await this.ftAuthService.getUserData(accessToken);
    // 신규가입자라면 DB에 저장한다.
    const { user, mfaCode } = await this.authService.findOrCreateUser(userData);

    // 사용자 정보를 이용해 JWT 토큰을 생성한다.
    const { jwtAccessToken, jwtRefreshToken } =
      await this.authService.generateJwtToken(user);

    // token을 쿠키에 저장한다.
    res.cookie('accessToken', jwtAccessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    });

    res.cookie('refreshToken', jwtRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    });

    const userSigninResponseDto: UserSigninResponseDto = {
      userId: user.id,
      isFirstLogin: user.nickname.at(0) === this.nicknamePrefix,
      isMfaEnabled: user.isMfaEnabled,
      mfaCode,
    };

    return res.send(userSigninResponseDto);
  }

  @Patch('/login')
  @UseGuards(JwtAuthGuard)
  async login(@GetUser() user: User, @Body() loginRequestDto: LoginRequestDto) {
    // try catch 처리 대신 exception filter로 처리 예정
    await this.usersService.login(user.id, loginRequestDto);
  }
}
