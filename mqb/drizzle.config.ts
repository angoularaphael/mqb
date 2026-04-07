import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  driver: 'better-sqlite',
  dbCredentials: {
    // Chemin fichier explicite (évite les erreurs "directory does not exist" avec file:./ sous Windows)
    url: process.env.DATABASE_URL?.replace(/^file:/, '') || './database.db',
  },
} satisfies Config;
