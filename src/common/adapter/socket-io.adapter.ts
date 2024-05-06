import { INestApplicationContext, UnauthorizedException } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Server, ServerOptions, Socket } from 'socket.io';
import { User } from '../../user-repository/entities/user.entity';
import { UsersRepository } from '../../user-repository/users.repository';
import jwtConfig from '../../config/jwt.config';
import { JwtService } from '@nestjs/jwt';
import { ConfigType } from '@nestjs/config';

type JwtPayload = {
	user: User;
};

export type SocketWithAuth = Socket & JwtPayload;

export class SocketIoAdapter extends IoAdapter {
	constructor(private app: INestApplicationContext) {
		super(app);
	}

	createIOServer(port: number, options?: any) {
		const clientPort = '3003';

		const cors = {
			credentials: true,
			origin: [
				`http://localhost:${clientPort}`,
				new RegExp(
					`/^http:\/\/192\.168\.1\.([1-9]|[1-9]\d):${clientPort}$/`,
				),
			],
		};

		const optionsWithCORS: ServerOptions = {
			...options,
			cors,
		};

		const server: Server = super.createIOServer(port, optionsWithCORS);

		const jwtService = this.app.get(JwtService);
		const jwtConfigure: ConfigType<typeof jwtConfig> = this.app.get(
			jwtConfig.KEY,
		);
		const userRepository = this.app.get(UsersRepository);

		const namespaces = ['channels', 'game'];

		namespaces.forEach((namespace) =>
			server
				.of(namespace)
				.use(
					wsAuthGuardMiddleware(
						jwtService,
						jwtConfigure,
						userRepository,
					),
				),
		);

		return server;
	}
}

function wsAuthGuardMiddleware(
	jwtService: JwtService,
	jwtConfigure: ConfigType<typeof jwtConfig>,
	usersRepository: UsersRepository,
) {
	return async (socket: SocketWithAuth, next: () => void) => {
		const cookie = socket.handshake.headers.cookie;
		if (!cookie) throw new UnauthorizedException('no cookie');

		const accessToken = cookie.split(';')[0].split('=')[1];
		if (!accessToken) throw new UnauthorizedException('no access token');

		const payload = await jwtService.verifyAsync(accessToken, {
			secret: jwtConfigure.secret,
		});
		if (!payload) throw new UnauthorizedException('no payload');

		const user = await usersRepository.findOne({
			where: { id: payload.id },
		});
		if (!user) throw new UnauthorizedException('no user');

		socket.user = user;
		next();
	};
}
