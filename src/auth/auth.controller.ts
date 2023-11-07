import {
  Controller,
  Get,
  Logger,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { Auth42Service } from './auth-42.service';
import { AuthService } from './auth.service';
import { UserSigninResponseDto } from './dto/user-signin-response.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly auth42Service: Auth42Service,
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

  @Post('/login')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: './uploads',
      }),
    }),
  )
  async login(@UploadedFile() file: Express.Multer.File) {
    console.log('file: ', file);
    return `http://localhost:3000/auth/login/${file.filename}`;
  }
}
