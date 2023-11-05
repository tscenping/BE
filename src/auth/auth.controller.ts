import { Controller, Get, Logger, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Auth42Service } from './auth-42.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly auth42Service: Auth42Service,
  ) {}
  private readonly logger = new Logger(AuthController.name);

  @Get('/signin')
  async signin(@Query('code') code: string) {
    // code를 이용해 access token을 받아온다.
    const accessToken = await this.auth42Service.getAccessToken(code);
    // access token을 이용해 사용자 정보를 받아온다.
    const userData = await this.auth42Service.getUserData(accessToken);
    // 사용자 정보를 이용해 JWT 토큰을 생성한다.
    const jwt = await this.authService.signin(userData);
  }
}
