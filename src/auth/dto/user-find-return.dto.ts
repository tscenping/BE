import { User } from 'src/users/entities/user.entity';

export type UserFindReturnDto = {
	user: User;
	mfaUrl?: string;
};
