import { logger } from "@pkg/shared";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

const connectionString =
  process.env["DATABASE_URL"] ?? "postgresql://postgres@127.0.0.1/whatsapp_scheduler";

const client = postgres(connectionString, {
  max: 10,
  onnotice: () => {} // Suppress notices
});

export const db = drizzle(client, { schema });

export async function testConnection(): Promise<boolean> {
  try {
    await client`SELECT 1`;
    logger.info("Database connection established");
    return true;
  } catch (error) {
    logger.error({ error }, "Failed to connect to database");
    return false;
  }
}

export { schema };
