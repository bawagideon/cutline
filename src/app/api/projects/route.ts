import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest, UnauthorizedError, ForbiddenError } from '@/lib/auth/session';
import { getSupabaseServiceClient } from '@/lib/database/client';

const CreateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100),
  description: z.string().optional().default(''),
  category: z.enum(['Documentary', 'Education', 'News', 'Fiction']).default('Documentary'),
  format: z.enum(['16:9', '9:16']).default('16:9'),
  language: z.string().default('English (Nigeria)'),
});

export async function GET(req: NextRequest) {
  try {
    const session = await authenticateRequest(req);
    const supabase = getSupabaseServiceClient();

    const { data: projects, error } = await supabase
      .from('projects')
      .select('*, episodes(count)')
      .eq('workspace_id', session.workspaceId)
      .order('updated_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to retrieve projects.' }, { status: 500 });
    }

    return NextResponse.json({ projects: projects || [] });
  } catch (err: unknown) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await authenticateRequest(req);
    const body = await req.json();
    const validated = CreateProjectSchema.parse(body);

    const supabase = getSupabaseServiceClient();
    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        workspace_id: session.workspaceId,
        name: validated.name,
        description: validated.description,
        category: validated.category,
        format: validated.format,
        language: validated.language,
        status: 'Active',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to create project.' }, { status: 500 });
    }

    return NextResponse.json({ project }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: err.issues }, { status: 400 });
    }
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
