-- Cutline Studio V2 Migration: Settings, Script Versioning & Invoices
-- Migration: 20261018000000_cutline_v2_settings_and_history.sql

-- 1. Script Versions Table (Screen 30)
CREATE TABLE IF NOT EXISTS public.script_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    episode_id UUID NOT NULL REFERENCES public.episodes(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    label TEXT NOT NULL, -- e.g. "Autosave 12:41", "AI revision accepted 11:20"
    author TEXT NOT NULL DEFAULT 'Ade Okafor',
    narration TEXT NOT NULL,
    visual_prompt TEXT,
    word_count INTEGER NOT NULL DEFAULT 0,
    estimated_duration_sec INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_script_versions_episode ON public.script_versions(episode_id, version_number DESC);

-- 2. Workspace Settings Table (Screens 33, 34, 35)
CREATE TABLE IF NOT EXISTS public.workspace_settings (
    workspace_id UUID PRIMARY KEY REFERENCES public.workspaces(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL DEFAULT 'Ade Okafor',
    email TEXT NOT NULL DEFAULT 'ade@studio.com',
    timezone TEXT NOT NULL DEFAULT 'Africa/Lagos',
    theme TEXT NOT NULL DEFAULT 'dark',
    -- Notification Preferences (Screen 34)
    notifications JSONB NOT NULL DEFAULT '{
        "job_failed": {"email": true, "push": false, "in_app": true},
        "review_ready": {"email": true, "push": false, "in_app": true},
        "publish_succeeded": {"email": true, "push": false, "in_app": true},
        "token_expiring": {"email": true, "push": false, "in_app": true},
        "budget_warning": {"email": true, "push": false, "in_app": true}
    }'::jsonb,
    -- Limits & Safeguards (Screen 35)
    max_concurrent_jobs INTEGER NOT NULL DEFAULT 2,
    max_scenes_per_episode INTEGER NOT NULL DEFAULT 12,
    max_file_size_mb INTEGER NOT NULL DEFAULT 500,
    retries_per_stage INTEGER NOT NULL DEFAULT 3,
    monthly_spend_cap_usd NUMERIC(10, 2) NOT NULL DEFAULT 60.00,
    require_approval_before_publish BOOLEAN NOT NULL DEFAULT TRUE,
    pause_jobs_at_spend_cap BOOLEAN NOT NULL DEFAULT TRUE,
    mark_ai_generated_content BOOLEAN NOT NULL DEFAULT TRUE,
    log_retention_days INTEGER NOT NULL DEFAULT 30,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Invoices Table (Screen 36)
CREATE TABLE IF NOT EXISTS public.billing_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL,
    billing_date DATE NOT NULL,
    amount_usd NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'paid', -- paid, pending, failed
    plan_name TEXT NOT NULL DEFAULT 'Creator',
    pdf_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_invoices_workspace ON public.billing_invoices(workspace_id, billing_date DESC);

-- Enable RLS
ALTER TABLE public.script_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_invoices ENABLE ROW LEVEL SECURITY;

-- Workspace-scoped RLS policies
CREATE POLICY "Workspace members can view script versions"
    ON public.script_versions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.episodes e
            JOIN public.projects p ON e.project_id = p.id
            JOIN public.workspace_members wm ON p.workspace_id = wm.workspace_id
            WHERE e.id = script_versions.episode_id AND wm.user_id = auth.uid()
        )
    );

CREATE POLICY "Workspace members can view workspace settings"
    ON public.workspace_settings FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members wm
            WHERE wm.workspace_id = workspace_settings.workspace_id AND wm.user_id = auth.uid()
        )
    );

CREATE POLICY "Workspace members can view billing invoices"
    ON public.billing_invoices FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members wm
            WHERE wm.workspace_id = billing_invoices.workspace_id AND wm.user_id = auth.uid()
        )
    );
