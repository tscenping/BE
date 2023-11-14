import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { UserRepository } from './users.repository';
import { LoginRequestDto } from './dto/login-request.dto';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UserRepository) {}

  private readonly logger = new Logger(UsersService.name);

  private dirPath = path.join(__dirname, '..', '..', 'public', 'users');

  async updateUserAvatar(userId: number, file: Express.Multer.File) {
    const dirPath = path.join(this.dirPath, userId.toString());

    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    const type = file.mimetype.split('/')[1];
    const filePath = path.join(dirPath, 'avatar.' + type);

    fs.writeFileSync(filePath, file.buffer);

    return await this.userRepository.update(
      { id: userId },
      { avatar: filePath },
    );
  }

  // TODO: test용 메서드. 추후 삭제
  async isNicknameExists(nickname: string) {
    const user = await this.userRepository.findOne({
      where: { nickname },
    });

    return !!user;
  }

  // TODO: test용 메서드. 추후 삭제
  async createUser(nickname: string, email: string) {
    const user = this.userRepository.create({
      nickname,
      email,
    });

    await this.userRepository.save(user);

    return user;
  }

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
