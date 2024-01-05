import {
	CanActivate,
	ExecutionContext,
	Inject,
	Injectable,
} from '@nestjs/common';
import { WSUnauthorizedException } from '../../common/exception/custom-exception';
import { SocketWithAuth } from '../../socket-adapter/socket-io.adapter';
import { JwtService } from '@nestjs/jwt';
import JwtConfig from '../../config/jwt.config';
import { ConfigType } from '@nestjs/config';
import { UsersRepository } from '../../users/users.repository';

@Injectable()
export class WsAuthGuard implements CanActivate {
	constructor(
		private readonly jwtService: JwtService,
		@Inject(JwtConfig.KEY)
		private readonly jwtConfigure: ConfigType<typeof JwtConfig>,
		private readonly usersRepository: UsersRepository,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const socket: SocketWithAuth = context.switchToWs().getClient();

		const cookie = socket.handshake.headers.cookie;
		if (!cookie) throw WSUnauthorizedException('no cookie');

		const accessToken = cookie.split(';')[0].split('=')[1];
		if (!accessToken) throw WSUnauthorizedException('no access token');
		// accessToken 유효성 검사

		const payload = await this.jwtService.verifyAsync(accessToken, {
			secret: this.jwtConfigure.secret,
		});
		if (!payload) throw WSUnauthorizedException('no payload');

		const user = await this.usersRepository.findOne({
			where: { id: payload.id },
		});
		if (!user) throw WSUnauthorizedException('no user');

		socket.user = user;
		return true;
	}
}
