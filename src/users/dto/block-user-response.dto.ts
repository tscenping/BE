import { FriendUserReturnDto } from './friend-user-return.dto';

export type BlockUserResponseDto = {
	blocks: FriendUserReturnDto[];

	totalItemCount: number;
};
