import { BlockUserReturnDto } from './block-user-return.dto';

export type BlockUserResponseDto = {
	blocks: BlockUserReturnDto[];

	totalItemCount: number;
};
