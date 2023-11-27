import { Test, TestingModule } from '@nestjs/testing';
import { ChannelsService } from './channels.service';
import { Channel } from './entities/channel.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ChannelUser } from './entities/channel-user.entity';
import { Repository } from 'typeorm';

describe('ChannelsService', () => {
	let channelsService: ChannelsService;
	let channelsRepository: Repository<Channel>;
	let channelUsersRepository: Repository<ChannelUser>;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			// imports: [
			// 	TypeOrmModule.forRootAsync({
			// 		inject: [typeOrmConfig.KEY],
			// 		useFactory: (
			// 			typeOrmConfigure: ConfigType<typeof typeOrmConfig>,
			// 		) => typeOrmConfigure,
			// 	}),
			// 	TypeOrmModule.forFeature([Channel, ChannelUser]),
			// 	ChannelsModule,
			// ],
			providers: [
				ChannelsService,
				{
					provide: getRepositoryToken(Channel),
					useValue: {
						findOne: jest.fn(),
						update: jest.fn(),
					},
				},
				{
					provide: getRepositoryToken(ChannelUser),
					useValue: {
						findOne: jest.fn(),
					},
				},
			],
		}).compile();

		channelsService = module.get<ChannelsService>(ChannelsService);
		channelsRepository = module.get<Repository<Channel>>(
			getRepositoryToken(Channel),
		);
		channelUsersRepository = module.get<Repository<ChannelUser>>(
			getRepositoryToken(ChannelUser),
		);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('update password', () => {
		it('should modify password and chnnel type', async () => {
			it('should update channel password', async () => {
				// 해보자.
			});
		});
	});
});
