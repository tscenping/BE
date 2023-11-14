import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { BaseEntity } from '../../common/base-entity';
import { Column, Entity, Unique } from 'typeorm';

@Entity()
@Unique(['nickname'])
export class User extends BaseEntity {
  @Column({ unique: true })
  @IsString()
  @Length(1, 10)
  @Matches(/^[ㄱ-ㅎ가-힣a-zA-Z0-9!]+$/)
  nickname: string;

  @Column({ default: null })
  @IsString()
  avatar: string;

  @Column()
  @IsString()
  email: string;

  @Column({ default: false })
  @IsBoolean()
  isMfaEnabled: boolean;

  @Column({ default: 1000 }) // TODO: 기본점수 검사
  @IsNumber()
  ladderScore: number;

  @Column({ default: 1000 })
  @IsNumber()
  ladderMaxScore: number;

  @Column({ default: 0 })
  @IsNumber()
  winCount: number;

  @Column({ default: 0 })
  @IsNumber()
  loseCount: number;

  //   @Column({ nullable: true })
  //   @IsString()
  //   accessToken!: string | null;

  @Column({ default: null })
  @IsString()
  refreshToken: string;

  @Column({ default: null })
  @IsString()
  gameSocketId: string;

  @Column({ default: null })
  @IsString()
  chatSocketId: string;

  @Column({ default: null })
  @Length(1, 20)
  @IsString()
  @IsOptional()
  @Matches(/^[ㄱ-ㅎ가-힣a-zA-Z0-9]+$/)
  statusMessage: string;
}
