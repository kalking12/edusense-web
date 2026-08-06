import Bull from "bull";
import { createClient } from "redis";

// Initialize Redis connection
export const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
  },
});

redisClient.connect().catch(console.error);

// Create OCR job queue
export const ocrQueue = new Bull("ocr-processing", {
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
  },
});

// Job data types
export interface OcrJobData {
  documentId: number;
  userId: number;
  s3Key: string;
  fileName: string;
}

// Handle job completion
ocrQueue.on("completed", (job) => {
  console.log(`OCR job ${job.id} completed for document ${job.data.documentId}`);
});

// Handle job failures
ocrQueue.on("failed", (job, err) => {
  console.error(`OCR job ${job.id} failed:`, err.message);
});

export default ocrQueue;
