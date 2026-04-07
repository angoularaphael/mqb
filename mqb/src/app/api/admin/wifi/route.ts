import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/api-auth';
import { z } from 'zod';
import { createWifiRow, listWifiCodes } from '@/lib/server/db-resources';

const bodySchema = z.object({
  code: z.string().min(4),
  networkName: z.string().optional(),
  expiresAt: z.coerce.number().int(),
  isActive: z.coerce.number().min(0).max(1).optional(),
});

export async function GET() {
  const auth = await requireAdminSession();
  if ('response' in auth) return auth.response;
  return NextResponse.json({ codes: await listWifiCodes() });
}

export async function POST(request: Request) {
  const auth = await requireAdminSession();
  if ('response' in auth) return auth.response;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 422 });
  }
  const w = await createWifiRow({
    code: parsed.data.code,
    networkName: parsed.data.networkName ?? 'MQB-Guest',
    expiresAt: parsed.data.expiresAt,
    isActive: parsed.data.isActive ?? 1,
  });
  return NextResponse.json({ code: w }, { status: 201 });
}
