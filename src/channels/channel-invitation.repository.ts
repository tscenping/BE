import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ChannelInvitation } from './entities/channel-invitation.entity';
import { CreateInvitationParamDto } from './dto/create-invitation-param.dto';
import { DBUpdateFailureException } from '../common/exception/custom-exception';

export class ChannelInvitationRepository extends Repository<ChannelInvitation> {
	constructor(
		@InjectRepository(ChannelInvitation) private dataSource: DataSource,
	) {
		super(ChannelInvitation, dataSource.manager);
	}

	async createChannelInvitation(
		createChannelInvitationParamDto: CreateInvitationParamDto,
	) {
		const channelInvitation = this.create({
			channelId: createChannelInvitationParamDto.channelId,
			invitingUserId: createChannelInvitationParamDto.invitingUserId,
			invitedUserId: createChannelInvitationParamDto.invitedUserId,
		});
		const result = await this.save(channelInvitation);
		if (!result)
			throw DBUpdateFailureException('create channel invitation failed');
	}
}
