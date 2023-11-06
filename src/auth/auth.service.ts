import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/users/entities/user.entity';
import { UserRepository } from './../users/users.repository';
import { User42Dto } from './dto/user-42.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async findOrCreateUser(userData: User42Dto) {
    let user: User = await this.userRepository.findOne({
      where: { email: userData.email },
    });
    let mfaQRCode: string = null;
    // 이미 사용자가 존재한다면
    if (user) {
      if (user.isMfaEnabled) {
        // MFA가 활성화되어 있다면, MFA 인증을 진행한다.
        mfaQRCode = 'mfaQRCode'; // TODO: MFA qr 생성 및 user table에 secret 저장
      }
    }
    // 사용자가 존재하지 않는다면, 새로운 사용자를 생성한다.
    else {
      user = this.userRepository.create(userData);
      user.nickname = process.env.FIRST_NICKNAME_PREFIX + userData.nickname;
      await this.userRepository.save(user);
    }
    return { user, mfaQRCode };
  }

  async generateJwtToken(user: User) {
    const payload = { id: user.id, nickname: user.nickname };
    // accessToken 생성
    const accessToken = await this.jwtService.signAsync(payload);
    // refreshToken 생성
    const refreshToken = await this.jwtService.signAsync({ id: payload.id });
    // refreshToken을 DB에 저장한다.
    await this.userRepository.update(user.id, { refreshToken });
    return { jwtAccessToken: accessToken, jwtRefreshToken: refreshToken };
  }
}
