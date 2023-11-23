import {
	Inject,
	Injectable,
	Logger,
	UnauthorizedException,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import axios from 'axios';
import ftConfig from '../config/ft.config';
import { FtUserParamDto } from './dto/ft-user-param.dto';
import { FtOauthResponseDto } from './dto/ft-oauth-response.dto';

@Injectable()
export class FtAuthService {
	constructor(
		@Inject(ftConfig.KEY)
		private readonly ftConfigure: ConfigType<typeof ftConfig>,
	) {}

	private readonly logger = new Logger(FtAuthService.name);
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
				} satisfies FtOauthResponseDto,
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

	async getUserData(accessToken: string): Promise<FtUserParamDto> {
		try {
			const response = await axios.get(`${this.baseUrl}/v2/me`, {
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			});

			const userData: FtUserParamDto = {
				email: response.data.email,
				ftId: response.data.id,
			};
			this.logger.log('user: ', userData);

			return userData;
		} catch (error) {
			this.logger.error(error);
			throw new UnauthorizedException('Invalid 42 access token');
		}
	}
}
