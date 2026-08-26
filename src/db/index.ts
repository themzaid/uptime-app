import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Grab the connection string we just put in your .env.local file
const connectionString = process.env.DATABASE_URL!;

// Set up the Neon connection
const sql = neon(connectionString);

// Initialize Drizzle ORM and pass it our schema so it knows about the tables
export const db = drizzle(sql, { schema });
