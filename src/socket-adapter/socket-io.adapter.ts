import { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Server, ServerOptions, Socket } from 'socket.io';
import { User } from '../users/entities/user.entity';

type JwtPayload = {
	user: User;
};

export type SocketWithAuth = Socket & JwtPayload;

export class SocketIoAdapter extends IoAdapter {
	constructor(private app: INestApplicationContext) {
		super(app);
	}

	createIOServer(port: number, options?: any) {
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
		return server;
	}
}
