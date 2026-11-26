import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/server/supabase-admin';

export const runtime = 'nodejs';

/**
 * Verifies a certificate ID against the Supabase `certificates` table.
 * Issue certificates by adding rows in Supabase → Table Editor → certificates.
 */
export async function POST(request: Request) {
  try {
    const { certificateId } = await request.json();

    if (!certificateId || typeof certificateId !== 'string') {
      return NextResponse.json({ error: 'Certificate ID is required' }, { status: 400 });
    }
    const id = certificateId.trim().toUpperCase();

    const admin = getAdminClient();
    if (!admin) {
      return NextResponse.json({ error: 'Verification service unavailable' }, { status: 503 });
    }
    const { data, error } = await admin
      .from('certificates')
      .select('id, name, course, issued_date')
      .ilike('id', id)
      .maybeSingle();
    if (error) {
      console.error('Certificate lookup failed:', error);
      return NextResponse.json({ error: 'Verification service unavailable' }, { status: 502 });
    }
    if (data) {
      return NextResponse.json({
        valid: true,
        cert: { id: data.id, name: data.name, course: data.course, date: data.issued_date },
      });
    }
    return NextResponse.json({ valid: false, error: 'Certificate not found' });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
