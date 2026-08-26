import { neon } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

// Extract the type from the Neon driver so our app has consistent types
type DbType = ReturnType<typeof drizzleNeon<typeof schema>>;

let db: DbType;

if (process.env.NODE_ENV === 'production') {
    // Use Neon HTTP driver for Vercel / Edge deployments
    const sql = neon(connectionString);
    db = drizzleNeon(sql, { schema }) as unknown as DbType;
} else {
    // Use standard TCP Postgres driver for local Docker development
    const queryClient = postgres(connectionString);
    db = drizzlePostgres(queryClient, { schema }) as unknown as DbType;
}

export { db };
