import path from "path";
import fs from "fs";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
const s3Client = new S3Client({ region: process.env.AWS_BUCKET_REGION });

const uploadToS3 = async (filepath, mimetype) => {
  const fileStream = fs.createReadStream(filepath);

  const uploadParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: path.basename(filepath),
    ContentType: mimetype,
    Body: fileStream,
  };

  return s3Client.send(new PutObjectCommand(uploadParams));
};

const deleteFromS3 = async (filename) => {
  const bucketParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: filename
  };

  return s3Client.send(new DeleteObjectCommand(bucketParams));
};

export {
  uploadToS3,
  deleteFromS3
}
