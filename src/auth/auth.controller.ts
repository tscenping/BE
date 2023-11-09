import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Logger,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from './../users/users.service';
import { Auth42Service } from './auth-42.service';
import { AuthService } from './auth.service';
import { UserSigninResponseDto } from './dto/user-signin-response.dto';
import { GetUser } from './get-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  private readonly nicknamePrefix: string;

  constructor(
    private readonly authService: AuthService,
    private readonly auth42Service: Auth42Service,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {
    this.nicknamePrefix = this.configService.getOrThrow<string>(
      'FIRST_NICKNAME_PREFIX',
    );
  }
  private readonly logger = new Logger(AuthController.name);

  @Post('/signin')
  async signin(@Body('code') code: string, @Res() res: Response) {
    // code를 이용해 access token을 받아온다.
    const accessToken = await this.auth42Service.getAccessToken(code);
    // access token을 이용해 사용자 정보를 받아온다.
    const userData = await this.auth42Service.getUserData(accessToken);
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

  @Post('/login')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('avatar'))
  async login(
    @GetUser() user: User,
    @UploadedFile() file: Express.Multer.File,
    @Body('nickname') nickname: string,
  ) {
    console.log(user);
    console.log(file);
    console.log(nickname);

    if (!file) {
      throw new HttpException('avatar is required', HttpStatus.BAD_REQUEST);
    }

    // return this.usersService.updateUserAvatar(user.id, file);
  }
}
