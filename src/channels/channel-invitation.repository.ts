import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ChannelInvitation } from './entities/channel-invitation.entity';
import { CreateInvitationParamDto } from './dto/create-invitation-param.dto';
import { DBUpdateFailureException } from '../common/exception/custom-exception';
import { DeleteChannelInvitationParamDto } from './dto/delete-invitation-param.dto';

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
			invitingUserId: createChannelInvitationParamDto.invitingUser.id,
			invitedUserId: createChannelInvitationParamDto.invitedUserId,
		});
		const result = await this.save(channelInvitation);
		if (!result)
			throw DBUpdateFailureException('create channel invitation failed');

		return result;
	}

	async deleteChannelInvitation(
		deleteChannelInvitation: DeleteChannelInvitationParamDto,
	) {
		const result = await this.softDelete(
			deleteChannelInvitation.invitationId,
		);
		if (result.affected !== 1)
			throw DBUpdateFailureException('delete channel invitation failed');
	}
}
