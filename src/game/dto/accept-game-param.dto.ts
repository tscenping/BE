import { User } from '../../users/entities/user.entity';

export class acceptGameParamDto {
	invitationId: number;
	invitedUser: User;
}
