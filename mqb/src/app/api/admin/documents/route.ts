import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/api-auth';
import { documentSchema } from '@/lib/validations';
import { createDocumentRow, listAllDocuments } from '@/lib/server/db-resources';
import { storeUploadedFile } from '@/lib/uploads';

export async function GET() {
  const auth = await requireAdminSession();
  if ('response' in auth) return auth.response;
  const documents = await listAllDocuments();
  return NextResponse.json({ documents });
}

export async function POST(request: Request) {
  const auth = await requireAdminSession();
  if ('response' in auth) return auth.response;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Formulaire invalide' }, { status: 400 });
  }

  const file = form.get('file');
  if (!(file instanceof Blob) || file.size === 0) {
    return NextResponse.json({ error: 'Fichier requis' }, { status: 422 });
  }

  const meta = {
    title: String(form.get('title') ?? ''),
    description: form.get('description') ? String(form.get('description')) : undefined,
    courseId: form.get('courseId') ? String(form.get('courseId')) : undefined,
    visibility: String(form.get('visibility') ?? 'students'),
  };
  const parsed = documentSchema.safeParse(meta);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Invalide' }, { status: 422 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const origName =
    typeof (file as File).name === 'string' && (file as File).name ? (file as File).name : 'upload.bin';
  const { publicPath } = storeUploadedFile(origName, buf);
  const fileType = (file as File).type || null;

  const doc = await createDocumentRow({
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    filePath: publicPath,
    fileType,
    uploadedBy: auth.user.userId,
    courseId: parsed.data.courseId || null,
    visibility: parsed.data.visibility,
  });

  return NextResponse.json({ document: doc }, { status: 201 });
}
