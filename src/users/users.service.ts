import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { UserRepository } from './users.repository';
import { string } from 'zod';
import { User } from './entities/user.entity';
import { DBUpdateFailureException } from '../common/exception/custom-exception';
import { LoginRequestDto } from './dto/login-request.dto';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UserRepository) {}

  //logger interceptor 만들기

  async login(userId: number, loginRequestDto: LoginRequestDto) {
    const avatar = loginRequestDto?.avatar;
    const nickname = loginRequestDto?.nickname;
    if (!avatar || !nickname) {
      throw new HttpException(
        'Request data is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user)
      throw new HttpException(`there is no user`, HttpStatus.BAD_REQUEST);

    const result = await this.userRepository.update(userId, {
      avatar: avatar,
      nickname: nickname,
    });
  }
}
