import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import axios from 'axios';
import { User42Dto } from './dto/user-42.dto';

@Injectable()
export class Auth42Service {
  private readonly logger = new Logger(Auth42Service.name);
  private readonly baseUrl = 'https://api.intra.42.fr';

  async getAccessToken(code: string): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/oauth/token`,
        {
          grant_type: 'authorization_code',
          client_id: process.env.FORTYTWO_CLIENT_ID,
          client_secret: process.env.FORTYTWO_CLIENT_SECRET,
          code,
          redirect_uri: process.env.FORTYTWO_REDIRECT_URI,
        },
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
