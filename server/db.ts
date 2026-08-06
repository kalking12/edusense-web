import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../drizzle/schema";
import { eq } from "drizzle-orm";

let db: any = null;

export async function getDb() {
  if (!db) {
    const pool = await mysql.createPool(process.env.DATABASE_URL!);
    db = drizzle(pool, { schema, mode: 'default' });
  }
  return db;
}

export async function createOcrDocument(data: schema.InsertOcrDocument) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const result = await database.insert(schema.ocrDocuments).values(data);
  return result;
}

export async function getOcrDocuments() {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const docs = await database.select().from(schema.ocrDocuments).orderBy(schema.ocrDocuments.createdAt);
  return docs;
}

export async function getOcrDocumentById(id: number) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const doc = await database.select().from(schema.ocrDocuments).where(eq(schema.ocrDocuments.id, id));
  return doc[0];
}

export async function deleteOcrDocument(id: number) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  await database.delete(schema.ocrDocuments).where(eq(schema.ocrDocuments.id, id));
}

export async function updateOcrDocument(id: number, data: Partial<schema.InsertOcrDocument>) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const result = await database.update(schema.ocrDocuments).set(data).where(eq(schema.ocrDocuments.id, id));
  return result;
}

export async function getUserByOpenId(openId: string) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const user = await database.select().from(schema.users).where(eq(schema.users.openId, openId));
  return user[0];
}

export async function upsertUser(data: Partial<schema.InsertUser> & { openId: string }) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const existing = await getUserByOpenId(data.openId);
  if (existing) {
    await database.update(schema.users).set(data).where(eq(schema.users.openId, data.openId));
    return existing;
  }
  const result = await database.insert(schema.users).values(data as schema.InsertUser);
  return data as schema.User;
}
