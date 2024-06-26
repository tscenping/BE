// pagenation에서 한 페이지에 보여줄 데이터 개수
export const DEFAULT_PAGE_SIZE = 10;
export const GAME_DEFAULT_PAGE_SIZE = 5;

// mute 시간
export const MUTE_TIME = 30;

// 정규식
export const NICKNAME_REGEXP = /^[가-힣a-zA-Z0-9]*$/;

export const STATUS_MESSAGE_REGEXP = /^[ㄱ-ㅎㅏ-ㅣ가-힣a-zA-Z0-9]*$/;
export const STATUS_MESSAGE_STRING = '^[ㄱ-ㅎㅏ-ㅣ가-힣a-zA-Z0-9|\\s]*$';

export const CHANNEL_PASSWORD_REGEXP =
	/^[a-zA-Z0-9`~₩;'"!@#$%^&*()_+|<>?:{}]*$/;

export const CHANNEL_NAME_REGEXP = /^[ㄱ-ㅎㅏ-ㅣ가-힣a-zA-Z0-9]*$/;

// ladder score
/* If K is of a lower value, then the rating is changed by a small fraction 
but if K is of a higher value, then the changes in the rating are significant.*/
export const K = 30;

export const S3_IMAGE_URL_PREFIX = 'https://d5xph0h5q8hbn.cloudfront.net';

export const S3_OBJECT_KEY_PREFIX = 'image';
export const S3_OBJECT_KEY_SUFFIX = '.jpeg';

export const S3_OBJECT_CONTENTTYPE = 'image/jpeg';
