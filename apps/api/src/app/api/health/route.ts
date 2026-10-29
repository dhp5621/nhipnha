import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'Nhịp Nhà API (Next.js Serverless)',
    version: '1.0.0',
    sdgs: ['SDG 3: Good Health & Well-being', 'SDG 4: Quality Education', 'SDG 8: Decent Work & Economic Growth'],
    competition: 'RBPC 2026',
    timestamp: new Date().toISOString(),
  });
}
