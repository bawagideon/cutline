import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/database/client';

export async function POST() {
  try {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut().catch(() => {});

    const response = NextResponse.json({ success: true });

    // Clear authentication cookies
    response.cookies.delete('sb-access-token');
    response.cookies.delete('cutline_session');
    response.cookies.delete('supabase-auth-token');

    return response;
  } catch {
    return NextResponse.json({ success: true });
  }
}
