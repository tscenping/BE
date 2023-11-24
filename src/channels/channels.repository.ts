import { InjectRepository } from '@nestjs/typeorm';
import { Channel } from './entities/channel.entity';
import { Repository, DataSource } from 'typeorm';
import { ChannelUser } from './entities/channel-user.entity';
import { DBUpdateFailureException } from '../common/exception/custom-exception';

export class ChannelsRepository extends Repository<Channel> {
	constructor(@InjectRepository(Channel) private dataSource: DataSource) {
		super(Channel, dataSource.manager);
	}

	async updateOwnerId(channelId: number) {
		await this.update(channelId, {
			ownerId: null,
		});
	}

	async findDmChannelUser(
		userId: number,
		targetUserId: number,
	): Promise<ChannelUser> {
		const [dmChannelUser] = await this.dataSource.query(
			`
			SELECT cu.*
			FROM channel_user cu
			WHERE cu."channelId" IN
				(SELECT c.id
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

	async softDeleteChannel(channelId: number) {
		const result = await this.softDelete(channelId);
		if (result.affected !== 1)
			throw DBUpdateFailureException('delete channel failed');
	}
}
