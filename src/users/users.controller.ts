import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { GetUser } from 'src/auth/get-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PositiveIntPipe } from 'src/common/pipes/positiveInt.pipe';
import { User } from './entities/user.entity';
import { FriendsService } from './friends.service';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly friendsService: FriendsService,
  ) {}

  @Post('/friends')
  @UseGuards(JwtAuthGuard)
  async createFriend(
    @GetUser() user: User,
    @Body('friendId', ParseIntPipe, PositiveIntPipe) toUserId: number,
  ) {
    await this.friendsService.createFriend(user.id, toUserId);
    // TODO: 친구요청을 받은 유저에게 알림 보내기
  }

  @Delete('/friends')
  @UseGuards(JwtAuthGuard)
  async deleteFriend(
    @GetUser() user: User,
    @Body('friendId', ParseIntPipe, PositiveIntPipe) toUserId: number,
  ) {
    await this.friendsService.deleteFriend(user.id, toUserId);
  }

  @Get('/friends/:page')
  @UseGuards(JwtAuthGuard)
  async findFriendsWithPage(
    @GetUser() user: User,
    @Param('page', ParseIntPipe, PositiveIntPipe) page: number,
  ) {
    const { friends, pageInfo } = await this.friendsService.findFriendsWithPage(
      user.id,
      page,
    );
    return { friends, pageInfo };
  }
}
