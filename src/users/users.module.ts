import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserRepository } from './users.repository';
import { Friend } from './entities/friend.entity';
import { FriendRepository } from './friends.repository';
import { FriendsService } from './friends.service';
import { Block } from './entities/block.entity';
import { BlocksService } from './blocks.service';
import { BlocksRepository } from './blocks.repository';

@Module({
	imports: [TypeOrmModule.forFeature([User, Friend, Block])],
	controllers: [UsersController],
	providers: [
		UsersService,
		FriendsService,
		BlocksService,
		UserRepository,
		FriendRepository,
		BlocksRepository,
	],
	exports: [UsersService],
})
export class UsersModule {}
