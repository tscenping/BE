import {
	CanActivate,
	ExecutionContext,
	Inject,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import jwtConfig from '../../config/jwt.config';
import { ConfigType } from '@nestjs/config';
import { UsersRepository } from '../../user-repository/users.repository';
import { SocketWithAuth } from '../adapter/socket-io.adapter';

@Injectable()
export class WsAuthGuard implements CanActivate {
	constructor(
		private readonly jwtService: JwtService,
		@Inject(jwtConfig.KEY)
		private readonly jwtConfigure: ConfigType<typeof jwtConfig>,
		private readonly usersRepository: UsersRepository,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const socket: SocketWithAuth = context.switchToWs().getClient();

		const cookie = socket.handshake.headers.cookie;
		if (!cookie) throw new UnauthorizedException('no cookie');

		const accessToken = cookie.split(';')[0].split('=')[1];
		if (!accessToken) throw new UnauthorizedException('no access token');

		const payload = await this.jwtService.verifyAsync(accessToken, {
			secret: this.jwtConfigure.secret,
		});
		if (!payload) throw new UnauthorizedException('no payload');

		const user = await this.usersRepository.findOne({
			where: { id: payload.id },
		});
		if (!user) throw new UnauthorizedException('no user');

		socket.user = user;
		return true;
	}
}
