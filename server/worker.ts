import { ocrQueue, OcrJobData } from "./queue";
import * as db from "./db";
import { s3Client } from "./s3-upload";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import * as fs from "fs/promises";
import { createWriteStream } from "fs";
import { join } from "path";

// Note: Tesseract.js integration would go here
// For now, this is a placeholder that demonstrates the worker pattern

async function processOcrJob(jobData: OcrJobData): Promise<string> {
  console.log(`Processing OCR job for document ${jobData.documentId}`);

  try {
    // Download file from S3
    const getObjectCommand = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET || "edusense-uploads",
      Key: jobData.s3Key,
    });

    const response = await s3Client.send(getObjectCommand);
    const stream = response.Body as any;

    // Save to temp file
    const tempPath = join(process.cwd(), "temp", `ocr_${jobData.documentId}.png`);
    await fs.mkdir(join(process.cwd(), "temp"), { recursive: true });

    const writeStream = createWriteStream(tempPath);
    stream.pipe(writeStream);

    await new Promise<void>((resolve, reject) => {
      writeStream.on("finish", () => resolve());
      writeStream.on("error", reject);
    });

    // TODO: Run Tesseract.js here
    // For now, return placeholder text
    const recognizedText = `[OCR Result] Document processed: ${jobData.fileName}`;

    // Update database with results
    const database = await db.getDb();
    if (database) {
      await database
        .update(require("../drizzle/schema").ocrDocuments)
        .set({ rawOcrText: recognizedText })
        .where(require("drizzle-orm").eq(require("../drizzle/schema").ocrDocuments.id, jobData.documentId));
    }

    // Cleanup temp file
    await fs.unlink(tempPath).catch(console.error);

    return recognizedText;
  } catch (error) {
    console.error(`OCR processing failed for document ${jobData.documentId}:`, error);
    throw error;
  }
}

// Register job processor
ocrQueue.process(async (job) => {
  return await processOcrJob(job.data);
});

console.log("OCR Worker started and listening for jobs");
