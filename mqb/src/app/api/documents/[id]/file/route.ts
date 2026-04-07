import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { requireAuthSession } from '@/lib/api-auth';
import { loadDocumentIfAllowed } from '@/lib/server/document-access';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthSession();
  if ('response' in auth) return auth.response;
  const { id } = await params;
  const doc = await loadDocumentIfAllowed(id, auth.user.userId, auth.user.role);
  if (!doc) return NextResponse.json({ error: 'Introuvable ou accès refusé' }, { status: 404 });

  if (!doc.file_path.startsWith('/uploads/')) {
    return NextResponse.json({ error: 'Fichier non servi par cette route' }, { status: 400 });
  }

  const publicRoot = path.resolve(process.cwd(), 'public');
  const relative = doc.file_path.replace(/^\//, '');
  const abs = path.resolve(publicRoot, relative);
  if (!abs.startsWith(publicRoot) || !fs.existsSync(abs)) {
    return NextResponse.json({ error: 'Fichier absent' }, { status: 404 });
  }

  const buf = fs.readFileSync(abs);
  const safeName = doc.title.replace(/[^\w.\-àâäéèêëïîôùûüç\s]+/gi, '_').slice(0, 80);
  return new NextResponse(buf, {
    headers: {
      'Content-Type': doc.file_type || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(safeName || 'document')}"`,
    },
  });
}
