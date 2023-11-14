import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import axios from 'axios';
import ftConfig from './../config/ft.config';
import { User42Dto } from './dto/user-42.dto';

type FtOauthResponseBody = {
  grant_type: string;
  client_id: string;
  client_secret: string;
  code: string;
  redirect_uri: string;
};

@Injectable()
export class Auth42Service {
  constructor(
    @Inject(ftConfig.KEY)
    private readonly ftConfigure: ConfigType<typeof ftConfig>,
  ) {}

  private readonly logger = new Logger(Auth42Service.name);
  private readonly baseUrl = 'https://api.intra.42.fr';

  async getAccessToken(code: string): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/oauth/token`,
        {
          grant_type: 'authorization_code',
          client_id: this.ftConfigure.FT_CLIENT_ID,
          client_secret: this.ftConfigure.FT_CLIENT_SECRET,
          code,
          redirect_uri: this.ftConfigure.FT_REDIRECT_URI,
        } satisfies FtOauthResponseBody,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data.access_token;
    } catch (error) {
      this.logger.error(error);
      throw new UnauthorizedException('Invalid 42 code');
    }
  }

  async getUserData(accessToken: string): Promise<User42Dto> {
    try {
      const response = await axios.get(`${this.baseUrl}/v2/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const userData: User42Dto = {
        nickname: response.data.login,
        email: response.data.email,
        fortyTwoId: response.data.id,
      };
      this.logger.log('user: ', userData);

      return userData;
    } catch (error) {
      this.logger.error(error);
      throw new UnauthorizedException('Invalid 42 access token');
    }
  }
}
