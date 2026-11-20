import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/server/supabase-admin';

export const runtime = 'nodejs';

// Fallback sample data, used only until Supabase is configured.
const sampleCertificates = [
  { id: 'GIRSD-2026-CIBA', name: 'David Sterling', course: 'Executive Certificate in Business Analysis (CIBA)', date: '2026-10-14' },
  { id: 'GIRSD-2026-CAIG', name: 'Dr Elena Rostova', course: 'Executive Certificate in AI Governance (CAIG)', date: '2026-09-18' },
  { id: 'GIRSD-2026-CCRM', name: 'Marcus Vance', course: 'Executive Certificate in Cybersecurity Risk Management (CCRM)', date: '2026-08-22' },
  { id: 'GIRSD-2026-001', name: 'John Doe', course: 'Certificate in Strategic Leadership', date: '2026-05-15' },
];

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
    if (admin) {
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
    }

    // Supabase not configured yet — fall back to sample data
    const cert = sampleCertificates.find((c) => c.id.toUpperCase() === id);
    if (cert) return NextResponse.json({ valid: true, cert });
    return NextResponse.json({ valid: false, error: 'Certificate not found' });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
