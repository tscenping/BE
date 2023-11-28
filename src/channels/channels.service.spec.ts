import { Test, TestingModule } from '@nestjs/testing';
import { ChannelsService } from './channels.service';
import { Channel } from './entities/channel.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ChannelUser } from './entities/channel-user.entity';
import { Repository } from 'typeorm';
import { UpdateChannelPwdParamDto } from './dto/update-channel-pwd-param.dto';
import { ChannelType, ChannelUserType } from '../common/enum';
import { ChannelsRepository } from './channels.repository';
import { ChannelUsersRepository } from './channel-users.repository';
import { ChannelInvitationRepository } from './channel-invitation.repository';
import { UsersRepository } from '../users/users.repository';
import * as bycrypt from 'bcrypt';

describe('ChannelsService', () => {
	let channelsService: ChannelsService;
	let channelRepository: Repository<Channel>;
	let channelUsersRepository: Repository<ChannelUser>;

	const mockChannelRepository = {
		findOne: jest.fn(),
		update: jest.fn(),
	};

	const mockChannelUserRepository = {
		findOne: jest.fn(),
	};

	const mockChannelInvitationRepository = {
		findOne: jest.fn(),
	};

	const mockUsersRepository = {
		findOne: jest.fn(),
	};

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				ChannelsService,
				{
					provide: getRepositoryToken(ChannelsRepository),
					useValue: mockChannelRepository,
				},
				{
					provide: getRepositoryToken(ChannelUsersRepository),
					useValue: mockChannelUserRepository,
				},
				{
					provide: getRepositoryToken(ChannelInvitationRepository),
					useValue: mockChannelInvitationRepository,
				},
				{
					provide: getRepositoryToken(UsersRepository),
					useValue: mockUsersRepository,
				},
			],
		}).compile();

		channelsService = module.get<ChannelsService>(ChannelsService);
		channelRepository = module.get<Repository<Channel>>(
			getRepositoryToken(ChannelsRepository),
		);
		channelUsersRepository = module.get<Repository<ChannelUser>>(
			getRepositoryToken(ChannelUsersRepository),
		);
	});

	describe('[success] update password', () => {
		it('should modify password and chnnel type', async () => {
			const mockUser = {
				id: 1,
			};

			const mockChannel = {
				id: 2,
				channelType: ChannelType.PUBLIC,
				password: null,
			};

			const mockChannelUser = {
				id: 3,
				channelId: 2,
				userId: 1,
				channelUserType: ChannelUserType.OWNER,
			};

			const updateResult = {
				affected: 1,
			};
			jest.spyOn(mockChannelRepository, 'findOne').mockResolvedValue(
				mockChannel,
			);
			jest.spyOn(mockChannelRepository, 'update').mockResolvedValue(
				updateResult,
			);
			jest.spyOn(mockChannelUserRepository, 'findOne').mockResolvedValue(
				mockChannelUser,
			);
			jest.spyOn(bycrypt, 'compare').mockImplementation(() =>
				Promise.resolve(false),
			);
			const updateChannelPwdParamDto = new UpdateChannelPwdParamDto(
				mockChannel.id,
				mockUser.id,
				'1234',
			);
			const result = await channelsService.updateChannelTypeAndPassword(
				updateChannelPwdParamDto,
			);
			expect(result).toBe(200);
		});
	});
});
