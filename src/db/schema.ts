import { pgTable, serial, text, integer, timestamp, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1. Monitors Table
// This stores the websites a user wants to watch (e.g., google.com)
export const monitors = pgTable('monitors', {
    id: serial('id').primaryKey(),
    userId: varchar('user_id', { length: 255 }).notNull(), // Links to the Clerk User ID
    name: varchar('name', { length: 255 }).notNull(),
    url: text('url').notNull(),
    interval: integer('interval').notNull().default(5), // How often to check (in minutes)
    orderIndex: integer('order_index').notNull().default(0), // For dashboard rearrangement
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 2. Checks Table
// Every time our worker pings a website, it records the result here
export const checks = pgTable('checks', {
    id: serial('id').primaryKey(),
    monitorId: integer('monitor_id')
        .notNull()
        .references(() => monitors.id, { onDelete: 'cascade' }), // If a monitor is deleted, delete its checks too
    statusCode: integer('status_code'), // e.g., 200 for OK, 500 for Error
    latency: integer('latency'), // How long it took to respond (in milliseconds)
    timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// 3. Incidents Table
// If a monitor goes down, we open an "incident" record here
export const incidents = pgTable('incidents', {
    id: serial('id').primaryKey(),
    monitorId: integer('monitor_id')
        .notNull()
        .references(() => monitors.id, { onDelete: 'cascade' }),
    status: varchar('status', { length: 50 }).notNull().default('open'), // 'open' or 'resolved'
    openedAt: timestamp('opened_at').defaultNow().notNull(),
    resolvedAt: timestamp('resolved_at'),
});


// --- RELATIONS ---
// These help Drizzle understand how our tables are connected

export const monitorsRelations = relations(monitors, ({ many }) => ({
    checks: many(checks),       // A monitor can have many checks over time
    incidents: many(incidents), // A monitor can have many incidents over time
}));

export const checksRelations = relations(checks, ({ one }) => ({
    monitor: one(monitors, {    // Every check belongs to exactly ONE monitor
        fields: [checks.monitorId],
        references: [monitors.id],
    }),
}));

export const incidentsRelations = relations(incidents, ({ one }) => ({
    monitor: one(monitors, {    // Every incident belongs to exactly ONE monitor
        fields: [incidents.monitorId],
        references: [monitors.id],
    }),
}));
