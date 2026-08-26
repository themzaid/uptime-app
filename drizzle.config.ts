import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// This tells Drizzle to look for our .env.local file so it can find the DATABASE_URL
dotenv.config({ path: ".env.local" });

export default defineConfig({
    schema: "./src/db/schema.ts",   // Where our tables are defined
    out: "./src/db/migrations",     // Where Drizzle will save migration history
    dialect: "postgresql",          // The type of database we are using
    dbCredentials: {
        url: process.env.DATABASE_URL!, // The connection string
    },
});
