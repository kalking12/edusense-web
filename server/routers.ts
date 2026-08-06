import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import * as db from "./db";
import { storagePut } from "./storage";
import { eq } from "drizzle-orm";
import * as schema from "../drizzle/schema";
import { spawn } from "child_process";
import { promises as fs } from "fs";
import { join } from "path";
import { ENV } from "./_core/env";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";

// Helper function to run MATLAB OCR
async function runMatlabOcr(inputPath: string, outputPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const timeout = 30000; // 30 second timeout
    const scriptPath = join(ENV.matlabScriptDir, "ocr_script");

    const matlab = spawn(ENV.matlabPath, [
      "-batch",
      `ocr_script('${inputPath}', '${outputPath}')`,
      "-nojvm",
      "-nodisplay",
      "-r",
      "exit",
    ]);

    const timer = setTimeout(() => {
      matlab.kill();
      reject(new Error("MATLAB OCR processing timeout (30s)"));
    }, timeout);

    let stderr = "";
    let stdout = "";

    matlab.stdout?.on("data", (data) => {
      stdout += data.toString();
    });

    matlab.stderr?.on("data", (data) => {
      stderr += data.toString();
    });

    matlab.on("close", async (code) => {
      clearTimeout(timer);

      if (code !== 0) {
        reject(new Error(`MATLAB OCR failed with code ${code}: ${stderr || stdout}`));
        return;
      }

      try {
        const text = await fs.readFile(outputPath, "utf-8");
        if (text.startsWith("ERROR:")) {
          reject(new Error(`MATLAB OCR error: ${text}`));
        } else {
          resolve(text);
        }
      } catch (e) {
        reject(new Error(`Failed to read MATLAB output: ${e}`));
      }
    });

    matlab.on("error", (err) => {
      clearTimeout(timer);
      reject(new Error(`Failed to spawn MATLAB process: ${err.message}`));
    });
  });
}

export const appRouter = router({
  ocr: router({
    processImage: protectedProcedure
      .input(z.object({
        imageData: z.string(),
        fileName: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const imageBuffer = Buffer.from(input.imageData, "base64");
        const uniqueId = uuidv4();
        const userId = ctx.user.id;

        // Validate file size (max 10MB)
        if (imageBuffer.length > 10 * 1024 * 1024) {
          throw new Error("File size exceeds 10MB limit");
        }

        // Upload image to S3
        const { key: imageKey, url: imageUrl } = await storagePut(
          `ocr/${uniqueId}.png`,
          imageBuffer,
          "image/png"
        );

        // Create temp directory for MATLAB processing
        const tempDir = join(process.cwd(), "temp");
        await fs.mkdir(tempDir, { recursive: true });

        const inputPath = join(tempDir, `input_${uniqueId}.png`);
        const outputPath = join(tempDir, `output_${uniqueId}.txt`);

        try {
          // Write image to temp file
          await fs.writeFile(inputPath, imageBuffer);

          // Run MATLAB OCR script
          const recognizedText = await runMatlabOcr(inputPath, outputPath);

          // Save to database with userId
          const result = await db.createOcrDocument({
            userId,
            fileName: input.fileName || `document_${uniqueId}.png`,
            rawOcrText: recognizedText,
            imageUrl,
            imageKey,
          });

          const docId = (result as any).insertId;
          return { documentId: docId, rawText: recognizedText };
        } finally {
          // Clean up temp files
          try {
            await fs.unlink(inputPath);
          } catch (e) {
            // File may not exist
          }
          try {
            await fs.unlink(outputPath);
          } catch (e) {
            // File may not exist
          }
        }
      }),

    getHistory: protectedProcedure.query(async ({ ctx }) => {
      const database = await db.getDb();
      if (!database) throw new Error("Database not available");
      
      // Only return documents for the authenticated user
      const docs = await database
        .select()
        .from(schema.ocrDocuments)
        .where(eq(schema.ocrDocuments.userId, ctx.user.id))
        .orderBy(schema.ocrDocuments.createdAt);
      
      return docs;
    }),

    getDocument: protectedProcedure
      .input(z.object({ documentId: z.number() }))
      .query(async ({ input, ctx }) => {
        const database = await db.getDb();
        if (!database) throw new Error("Database not available");
        
        const doc = await database
          .select()
          .from(schema.ocrDocuments)
          .where(
            eq(schema.ocrDocuments.id, input.documentId) &&
            eq(schema.ocrDocuments.userId, ctx.user.id)
          );
        
        if (!doc || doc.length === 0) {
          throw new Error("Document not found or access denied");
        }
        return doc[0];
      }),

    deleteDocument: protectedProcedure
      .input(z.object({ documentId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const database = await db.getDb();
        if (!database) throw new Error("Database not available");
        
        // Verify ownership before deleting
        const doc = await database
          .select()
          .from(schema.ocrDocuments)
          .where(
            eq(schema.ocrDocuments.id, input.documentId) &&
            eq(schema.ocrDocuments.userId, ctx.user.id)
          );
        
        if (!doc || doc.length === 0) {
          throw new Error("Document not found or access denied");
        }
        
        await database.delete(schema.ocrDocuments).where(eq(schema.ocrDocuments.id, input.documentId));
        return { success: true };
      }),
  }),
  auth: router({
    me: publicProcedure.query(async ({ ctx }) => {
      // Return current user if authenticated, null otherwise
      return ctx.user || null;
    }),
    logout: protectedProcedure.mutation(async ({ ctx }) => {
      // Logout is handled by clearing the session cookie on the client
      // This procedure just confirms the logout request
      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;
