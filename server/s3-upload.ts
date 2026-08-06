import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

const s3Client = new S3Client({ region: process.env.AWS_REGION || "us-east-1" });

export async function getPresignedUploadUrl(
  fileName: string,
  contentType: string
): Promise<{ uploadUrl: string; s3Key: string }> {
  const uniqueId = uuidv4();
  const s3Key = `ocr/${uniqueId}/${fileName}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET || "edusense-uploads",
    Key: s3Key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour expiry

  return { uploadUrl, s3Key };
}

export { s3Client };
