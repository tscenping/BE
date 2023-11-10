import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  ParseFilePipeBuilder,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Auth42Service } from './auth-42.service';
import { AuthService } from './auth.service';
import { UserSigninResponseDto } from './dto/user-signin-response.dto';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly auth42Service: Auth42Service,
    private readonly usersService: UsersService,
  ) {}
  private readonly logger = new Logger(AuthController.name);

  @Get('/signin')
  async signin(@Query('code') code: string, @Res() res: any) {
    // code를 이용해 access token을 받아온다.
    const accessToken = await this.auth42Service.getAccessToken(code);
    // access token을 이용해 사용자 정보를 받아온다.
    const userData = await this.auth42Service.getUserData(accessToken);
    // 신규가입자라면 DB에 저장한다.
    const { user, mfaQRCode } = await this.authService.findOrCreateUser(
      userData,
    );
    // 사용자 정보를 이용해 JWT 토큰을 생성한다.
    const { jwtAccessToken, jwtRefreshToken } =
      await this.authService.generateJwtToken(user);
    // token을 쿠키에 저장한다.
    res.cookie('accessToken', jwtAccessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });
    res.cookie('refreshToken', jwtRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });
    const userSigninResponseDto: UserSigninResponseDto = {
      userId: user.id,
      isFirstLogin: user.avatar === null,
      isMfaEnabled: user.isMfaEnabled,
      mfaQRCode,
    };
    return res.send(userSigninResponseDto);
  }

  @Patch('/login')
  // @UseGuards(JwtAuthGuard)
  async login(
    // @GetUser() user: User,
    @Body() nickname: string,
    @Body() avatar: string,
  ) {
    // console.log(user);
    console.log(nickname);

    if (!avatar) {
      throw new HttpException('avatar is required', HttpStatus.BAD_REQUEST);
    }

    // return this.usersService.updateUserAvatar(user.id, file);
  }
}
