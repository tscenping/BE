import {
  Body,
  Controller,
  Logger,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { User } from 'src/users/entities/user.entity';
import { UserRepository } from 'src/users/users.repository';
import { Auth42Service } from './auth-42.service';
import { AuthService } from './auth.service';
import { UserSigninResponseDto } from './dto/user-signin-response.dto';
import { GetUser } from './get-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly auth42Service: Auth42Service,
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
  ) {}
  private readonly logger = new Logger(AuthController.name);

  @Post('/signin')
  async signin(@Body('code') code: string, @Res() res: any) {
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
      isFirstLogin:
        user.nickname &&
        user.nickname[0] ===
          this.configService.get<string>('FIRST_NICKNAME_PREFIX'),
      isMfaEnabled: user.isMfaEnabled,
      mfaQRCode,
    };
    return res.send(userSigninResponseDto);
  }

  @Post('/login')
  @UseGuards(AuthGuard())
  @UseInterceptors(FileInterceptor('avatar'))
  async login(
    @GetUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    console.log(user);
    // return this.userRepository.updateAvatar(user.id, file);
  }
}
