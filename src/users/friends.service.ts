import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { FriendRepository } from './friends.repository';
import { UserRepository } from './users.repository';

@Injectable()
export class FriendsService {
  private readonly logger = new Logger(FriendsService.name);

  constructor(
    private readonly friendRepository: FriendRepository,
    private readonly userRepository: UserRepository,
  ) {}

  /**
   * 친구 추가
   * @param fromUserId 친구요청을 보낸 유저의 id
   * @param toUserId 친구요청을 받은 유저의 id
   * @returns
   */
  async createFriend(fromUserId: number, toUserId: number) {
    // 본인에게 친구요청을 보내는지 확인
    this.checkSelfFriendship(fromUserId, toUserId);

    // 친구요청을 받은 유저가 존재하는지 확인
    await this.validateUserExists(toUserId);

    // 이미 친구인지 확인
    await this.checkAlreadyFriends(fromUserId, toUserId);

    // 친구 추가
    const friend = this.friendRepository.create({
      fromUserId,
      toUserId,
    });
    this.logger.log('friend: ', friend);
    await this.friendRepository.save(friend);
  }

  /**
   * 친구 삭제
   * @param fromUserId 친구 삭제 요청을 보낸 유저의 id
   * @param toUserId 친구 삭제 요청을 받은 유저의 id
   */
  async deleteFriend(fromUserId: number, toUserId: number) {
    // 본인에게 친구 삭제 요청을 보내는지 확인
    this.checkSelfFriendship(fromUserId, toUserId);

    // 친구 삭제 요청을 받은 유저가 존재하는지 확인
    await this.validateUserExists(toUserId);

    // 친구인지 확인
    const friend = await this.findFriend(fromUserId, toUserId);
    if (!friend) {
      throw new BadRequestException(`Not friend with ${toUserId}`);
    }

    // 친구 삭제
    const result = await this.friendRepository.softDelete(friend.id);
    if (result.affected !== 1) {
      throw new BadRequestException(`Failed to delete friend with ${toUserId}`);
    }
    this.logger.log('result: ', result);
  }

  /**
   * 친구 entity 조회
   * @returns 친구 entity 또는 null
   */
  async findFriend(fromUserId: number, toUserId: number) {
    return await this.friendRepository.findOne({
      where: {
        fromUserId,
        toUserId,
      },
    });
  }

  /**
   * 유저가 존재하는지 확인
   */
  async validateUserExists(userId: number) {
    const user = await this.userRepository.findOne({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new BadRequestException(`User with id ${userId} doesn't exist`);
    }
  }

  /**
   * 본인에게 친구/친구삭제 요청을 보내는지 확인
   */
  private checkSelfFriendship(fromUserId: number, toUserId: number) {
    if (fromUserId === toUserId) {
      throw new BadRequestException(`Can't be friend with yourself`);
    }
  }

  /**
   * 이미 친구인지 확인
   */
  private async checkAlreadyFriends(fromUserId: number, toUserId: number) {
    const isExistFriend = await this.findFriend(fromUserId, toUserId);
    if (isExistFriend) {
      throw new BadRequestException(`Already friends`);
    }
  }
}
