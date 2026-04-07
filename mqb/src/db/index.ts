import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

/** Répertoire du package mqb (évite une database.db vide si `cwd` ≠ dossier du projet). */
function resolveMqbRoot(): string {
  let current = process.cwd();
  for (let i = 0; i < 12; i++) {
    const pkgPath = path.join(current, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as { name?: string };
        if (pkg.name === 'mqb-system') return current;
      } catch {
        /* ignore */
      }
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return process.cwd();
}

const raw = (process.env.DATABASE_URL ?? 'file:./database.db').replace(/^file:/, '').trim();
const dbPath = path.isAbsolute(raw)
  ? raw
  : path.resolve(resolveMqbRoot(), raw.replace(/^\.\//, ''));

const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite, { schema });

export default db;
