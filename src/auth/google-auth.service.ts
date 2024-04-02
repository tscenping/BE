import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import axios from 'axios';
import { OauthUserinfoParamDto } from './dto/oauth-userinfo-param.dto';
import { OauthResponseDto } from './dto/oauth-response.dto';
import googleConfig from '../config/google.config';

@Injectable()
export class GoogleAuthService {
	constructor(
		@Inject(googleConfig.KEY)
		private readonly googleConfigure: ConfigType<typeof googleConfig>,
	) {}

	async getAccessToken(code: string): Promise<string> {
		try {
			const response = await axios.post(
				`https://oauth2.googleapis.com/token`,
				{
					code: code,
					client_id: this.googleConfigure.GOOGLE_CLIENT_ID,
					client_secret: this.googleConfigure.GOOGLE_CLIENT_SECRET,
					redirect_uri: this.googleConfigure.GOOGLE_REDIRECT_URI,
					grant_type: 'authorization_code',
				} satisfies OauthResponseDto,
				{
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
					},
				},
			);

			return response.data.access_token;
		} catch (error) {
			throw new UnauthorizedException('Invalid google code');
		}
	}

	async getUserData(accessToken: string): Promise<OauthUserinfoParamDto> {
		try {
			const response = await axios.get(
				'https://www.googleapis.com/oauth2/v2/userinfo',
				{
					headers: {
						Authorization: `Bearer ${accessToken}`,
					},
				},
			);
			console.log('google response data: ', response.data);

			const userData: OauthUserinfoParamDto = {
				email: response.data.email,
				oauthId: response.data.id,
			};
			console.log('google user: ', userData);

			return userData;
		} catch (error) {
			throw new UnauthorizedException('Invalid google access token');
		}
	}
}
