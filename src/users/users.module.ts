import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Friend } from './entities/friend.entity';
import { User } from './entities/user.entity';
import { FriendRepository } from './friends.repository';
import { FriendsService } from './friends.service';
import { UsersController } from './users.controller';
import { UserRepository } from './users.repository';
import { UsersService } from './users.service';

@Module({
	imports: [TypeOrmModule.forFeature([User, Friend])],
	controllers: [UsersController],
	providers: [UsersService, FriendsService, UserRepository, FriendRepository],
	exports: [UsersService],
})
export class UsersModule {}
