import { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Server, ServerOptions, Socket } from 'socket.io';
import { User } from '../users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { UsersRepository } from '../users/users.repository';
import { WSUnauthorizedException } from '../common/exception/custom-exception';
import { ConfigService } from '@nestjs/config';

type JwtPayload = {
	user: User;
};

export type SocketWithAuth = Socket & JwtPayload;

export class SocketIoAdapter extends IoAdapter {
	constructor(private app: INestApplicationContext) {
		super(app);
	}

	createIOServer(port: number, options?: any) {
		const jwtService = this.app.get(JwtService);
		const userRepository = this.app.get(UsersRepository);
		const configService = this.app.get(ConfigService);
		const clientPort = '8001';

		const cors = {
			credentials: true,
			origin: [
				`https://localhost:${clientPort}`,
				new RegExp(
					`/^https:\/\/192\.168\.1\.([1-9]|[1-9]\d):${clientPort}$/`,
				),
			],
		};

		const optionsWithCORS: ServerOptions = {
			...options,
			cors,
		};

		const server: Server = super.createIOServer(port, optionsWithCORS);

		const namespaces = ['channels', 'game'];

		namespaces.forEach((ns) => {
			server
				.of(ns)
				.use(
					wsAuthGuardMiddleware(
						jwtService,
						configService,
						userRepository,
					),
				);
		});

		return server;
	}
}

const wsAuthGuardMiddleware =
	(
		jwtService: JwtService,
		configService: ConfigService,
		usersRepository: UsersRepository,
	) =>
	async (client: SocketWithAuth, next: any) => {
		const cookie = client.handshake.headers.cookie;
		if (!cookie) throw WSUnauthorizedException('no cookie'); // 고의로 예외 던지기

		const accessToken = cookie.split(';')[0].split('=')[1];
		if (!accessToken) throw WSUnauthorizedException('no access token');
		// 추후 accessToken 유효성 검사

		const payload = await jwtService.verifyAsync(accessToken, {
			secret: configService.get<string>('JWT_SECRET'),
		});
		if (!payload) throw WSUnauthorizedException('no payload');

		const user = await usersRepository.findOne({
			where: { id: payload.id },
		});
		if (!user) throw WSUnauthorizedException('no user');

		// 추후 gateway connection에서 쓸 user를 SocketWithAuth 객체에 넣어줌.
		client.user = user;
		next();
	};
