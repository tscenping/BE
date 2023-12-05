import { IoAdapter } from '@nestjs/platform-socket.io';
import { INestApplicationContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { WSUnauthorizedException } from '../common/exception/custom-exception';
import { UsersRepository } from '../users/users.repository';
import { User } from '../users/entities/user.entity';
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
		const configService = this.app.get(ConfigService);
		const userRepository = this.app.get(UsersRepository);

		const server: Server = super.createIOServer(port, options);

		const namespaces = ['channels'];

		namespaces.forEach((namespace) => {
			server
				.of(namespace)
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
	async (socket: SocketWithAuth, next: any) => {
		// const token = socket.handshake.auth.token;
		const cookie = socket.handshake.headers.cookie;
		if (!cookie) return next(WSUnauthorizedException('no cookie'));
		console.log('cookie:', cookie);

		const accessToken = cookie.split(';')[0].split('=')[1];
		if (!accessToken)
			return next(WSUnauthorizedException('no access token'));
		// accessToken 유효성 검사
		console.log('accessToken:', accessToken);

		const payload = await jwtService.verifyAsync(accessToken, {
			secret: configService.get<string>('JWT_SECRET'),
		});
		if (!payload) return next(WSUnauthorizedException('no payload'));
		console.log('payload:', JSON.stringify(payload));

		const user = await usersRepository.findOne({
			where: { id: payload.id },
		});
		if (!user) return next(WSUnauthorizedException('no user'));

		socket.user = user;
		next();
	};
