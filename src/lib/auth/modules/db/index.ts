import { Pool } from "pg";

export const dbConfig = new Pool({
  connectionString: process.env.POSTGRES_URL,
});
