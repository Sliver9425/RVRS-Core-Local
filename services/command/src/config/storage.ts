import { S3Client } from '@aws-sdk/client-s3';
import multer from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';
import dotenv from 'dotenv';
import { Request } from 'express'; 

dotenv.config();

const s3 = new S3Client({
  region: process.env.B2_REGION,
  endpoint: process.env.B2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.B2_KEY_ID || '',
    secretAccessKey: process.env.B2_APP_KEY || ''
  },
  forcePathStyle: true
});

export const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.B2_BUCKET_NAME || '',
    acl: 'public-read',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    
    metadata: function (req: Request, file: Express.Multer.File, cb: any) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req: Request, file: Express.Multer.File, cb: any) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'evidence/' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 }
});