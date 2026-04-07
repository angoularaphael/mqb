import fs from 'fs';
import path from 'path';

export const UPLOADS_PUBLIC_DIR = path.join(process.cwd(), 'public', 'uploads');

export function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_PUBLIC_DIR)) {
    fs.mkdirSync(UPLOADS_PUBLIC_DIR, { recursive: true });
  }
}

/** Chemin absolu disque + URL publique /uploads/... */
export function storeUploadedFile(originalName: string, buffer: Buffer): { diskPath: string; publicPath: string } {
  ensureUploadsDir();
  const ext = path.extname(originalName).slice(0, 20) || '.bin';
  const safe = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
  const diskPath = path.join(UPLOADS_PUBLIC_DIR, safe);
  fs.writeFileSync(diskPath, buffer);
  return { diskPath, publicPath: `/uploads/${safe}` };
}

export function deleteUploadedFile(publicPath: string) {
  if (!publicPath.startsWith('/uploads/')) return;
  const diskPath = path.join(process.cwd(), 'public', publicPath.replace(/^\//, ''));
  if (fs.existsSync(diskPath)) fs.unlinkSync(diskPath);
}
