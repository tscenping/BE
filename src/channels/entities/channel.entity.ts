import { InternalServerErrorException } from '@nestjs/common';
import * as bycrypt from 'bcrypt';
import {
	IsEnum,
	IsNumber,
	IsOptional,
	IsPositive,
	IsString,
} from 'class-validator';
import { BaseEntity } from 'src/common/base-entity';
import { ChannelType } from 'src/common/enum';
import { BeforeInsert, Column, Entity } from 'typeorm';

@Entity()
export class Channel extends BaseEntity {
	@Column()
	@IsString()
	name: string;

	@Column()
	@IsString()
	@IsEnum(ChannelType)
	channelType: ChannelType;

	@Column({ default: null, type: 'varchar' })
	@IsString()
	@IsOptional()
	password?: string | null;

	@Column({ default: null, type: 'integer' })
	@IsOptional()
	@IsNumber()
	@IsPositive()
	ownerId?: number | null;

	@BeforeInsert()
	async hashPassword() {
		if (this.password) {
			try {
				this.password = await bycrypt.hash(this.password, 10);
			} catch (e) {
				console.error(e);
				throw new InternalServerErrorException();
			}
		}
	}
}
