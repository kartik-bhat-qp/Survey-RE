/** Only a process-lifetime marker. No widget data is received or stored. */
export const dynamic = 'force-dynamic';
export function GET() {
  return Response.json({ session: `${process.pid}-${performance.timeOrigin}` }, { headers: { 'Cache-Control': 'no-store' } });
}
