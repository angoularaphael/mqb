/**
 * Applique les migrations SQL (dossier src/db/migrations).
 * Utilisé au démarrage Docker : base vide sur volume → tables créées avant next start.
 */
import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');
const db = drizzle(sqlite);
const migrationsFolder = path.join(__dirname, 'migrations');

migrate(db, { migrationsFolder });
sqlite.close();
