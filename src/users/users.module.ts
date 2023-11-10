import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserRepository } from './users.repository';
import { Friend } from './entities/friend.entity';
import { FriendRepository } from './friends.repository';
import { FriendsService } from './friends.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Friend])],
  controllers: [UsersController],
  providers: [UsersService, FriendsService, UserRepository, FriendRepository],
  exports: [UsersService],
})
export class UsersModule {}
