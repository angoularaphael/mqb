import fs from 'fs';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { stringify } from 'csv-stringify/sync';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export async function saveUploadedFile(buffer: Buffer, originalName: string): Promise<string> {
  const filename = `${uuid()}-${originalName}`;
  const filepath = path.join(UPLOADS_DIR, filename);
  
  fs.writeFileSync(filepath, buffer);
  return filename;
}

export function getUploadPath(filename: string): string {
  return path.join(UPLOADS_DIR, filename);
}

export function deleteUploadedFile(filename: string): boolean {
  try {
    const filepath = path.join(UPLOADS_DIR, filename);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

export function generateCSV(data: Record<string, any>[], columns?: string[]): string {
  return stringify(data, {
    header: true,
    columns: columns,
  });
}

export interface ExportOptions {
  fileName: string;
  data: Record<string, any>[];
  columns?: string[];
}

export function generateCSVFile(options: ExportOptions): Buffer {
  const csv = generateCSV(options.data, options.columns);
  return Buffer.from(csv, 'utf-8');
}

export async function saveCSVFile(options: ExportOptions): Promise<string> {
  const filename = `${options.fileName}-${Date.now()}.csv`;
  const filepath = path.join(UPLOADS_DIR, filename);
  const csv = generateCSV(options.data, options.columns);
  
  fs.writeFileSync(filepath, csv, 'utf-8');
  return filename;
}

export function listUploadedFiles(limit: number = 100): string[] {
  try {
    if (!fs.existsSync(UPLOADS_DIR)) return [];
    
    const files = fs.readdirSync(UPLOADS_DIR);
    return files.slice(-limit);
  } catch (error) {
    console.error('Error listing files:', error);
    return [];
  }
}
