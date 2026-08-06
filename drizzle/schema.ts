import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, longtext } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * OCR Documents table for storing uploaded images and their OCR results.
 * Each document is paired with its extracted text and can be retrieved from history.
 */
export const ocrDocuments = mysqlTable("ocr_documents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Foreign key to users table
  imageUrl: text("imageUrl").notNull(), // S3 URL to the uploaded image
  imageKey: varchar("imageKey", { length: 255 }).notNull(), // S3 file key for reference
  rawOcrText: longtext("rawOcrText").notNull(), // Raw OCR output from Tesseract.js
  processedText: longtext("processedText"), // Cleaned and formatted text
  fileName: varchar("fileName", { length: 255 }), // Original file name
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OcrDocument = typeof ocrDocuments.$inferSelect;
export type InsertOcrDocument = typeof ocrDocuments.$inferInsert;

/**
 * Session table for tracking anonymous user sessions (optional)
 */
export const sessions = mysqlTable("sessions", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 255 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;
