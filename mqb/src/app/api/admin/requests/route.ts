import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/api-auth';
import { listAllRequests } from '@/lib/server/db-resources';

export async function GET() {
  const auth = await requireAdminSession();
  if ('response' in auth) return auth.response;
  return NextResponse.json({ requests: await listAllRequests() });
}
