import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { UserRepository } from './users.repository';

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
}
