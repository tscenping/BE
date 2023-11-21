import { InjectRepository } from '@nestjs/typeorm';
import { Channel } from './entities/channel.entity';
import { Repository, DataSource } from 'typeorm';
import { ChannelType } from 'src/common/enum';
import { ChannelUser } from './entities/channel-user.entity';

export class ChannelsRepository extends Repository<Channel> {
	constructor(@InjectRepository(Channel) private dataSource: DataSource) {
		super(Channel, dataSource.manager);
	}

	async findDmChannelUser(userId: number, targetUserId: number) {
		const dmChannelUser = await this.dataSource.query(
			`
			SELECT *
			FROM channel_user cu
			WHERE cu."channelId" IN (SELECT c.id
								FROM channel_user cu2
										JOIN channel c
											ON cu2."channelId" = c.id
								WHERE cu2."userId" = $1
								AND c."channelType" = 'DM'
								AND c."deletedAt" IS NULL)
			AND cu."userId" = $2
			AND cu."deletedAt" IS NULL;
			`,
			[userId, targetUserId],
		);

		console.log(dmChannelUser);

		return dmChannelUser;
	}
}
