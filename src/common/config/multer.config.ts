import { ConfigService } from '@nestjs/config';
import { MulterModuleAsyncOptions } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { extname } from 'path';

export const multerConfig: MulterModuleAsyncOptions = {
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => {
    return {
      storage: diskStorage({
        destination: (req, file, callback) => {
          const uploadPath = __dirname + '/../../uploads';
          if (!existsSync(uploadPath)) {
            // uploads 폴더가 존재하지 않을시, 생성합니다.
            mkdirSync(uploadPath);
          }
          callback(null, uploadPath);
        },
        filename: (req, file, callback) => {
          const userAccessToken = 'test';
          const extension = extname(file.mimetype);
          callback(null, `${userAccessToken}-${file.fieldname}.${extension}`);
        },
      }),
    };
  },
};
