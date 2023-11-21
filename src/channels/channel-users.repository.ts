import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ChannelUser } from './entities/channel-user.entity';

export class ChannelUsersRepository extends Repository<ChannelUser> {
	constructor(@InjectRepository(ChannelUser) private dataSource: DataSource) {
		super(ChannelUser, dataSource.manager);
	}
}
