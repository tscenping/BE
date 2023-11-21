import { InjectRepository } from '@nestjs/typeorm';
import { Channel } from './entities/channel.entity';
import { Repository, DataSource } from 'typeorm';

export class ChannelsRepository extends Repository<Channel> {
	constructor(@InjectRepository(Channel) private dataSource: DataSource) {
		super(Channel, dataSource.manager);
	}
}
