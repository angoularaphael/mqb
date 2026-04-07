import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/api-auth';
import { z } from 'zod';
import { deleteWifiRow, getWifi, updateWifiRow } from '@/lib/server/db-resources';

const patchSchema = z.object({
  code: z.string().min(4).optional(),
  networkName: z.string().optional(),
  expiresAt: z.coerce.number().int().optional(),
  isActive: z.coerce.number().min(0).max(1).optional(),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminSession();
  if ('response' in auth) return auth.response;
  const { id } = await params;
  if (!(await getWifi(id))) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 422 });
  }
  const d = parsed.data;
  const w = await updateWifiRow(id, {
    code: d.code,
    networkName: d.networkName,
    expiresAt: d.expiresAt,
    isActive: d.isActive,
  });
  return NextResponse.json({ code: w });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminSession();
  if ('response' in auth) return auth.response;
  const { id } = await params;
  if (!(await getWifi(id))) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
  await deleteWifiRow(id);
  return NextResponse.json({ ok: true });
}
