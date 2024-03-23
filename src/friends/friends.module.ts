import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Friend } from './entities/friend.entity';
import { Block } from './entities/block.entity';
import { FriendsService } from './friends.service';
import { FriendsRepository } from './friends.repository';
import { BlocksService } from './blocks.service';
import { BlocksRepository } from './blocks.repository';
import { FriendsController } from './friends.controller';
import { UserRepositoryModule } from '../user-repository/user-repository.module';

@Module({
	imports: [TypeOrmModule.forFeature([Friend, Block]), UserRepositoryModule],
	controllers: [FriendsController],
	providers: [
		FriendsService,
		FriendsRepository,
		BlocksService,
		BlocksRepository,
	],
	exports: [FriendsRepository, BlocksRepository],
})
export class FriendsModule {}
