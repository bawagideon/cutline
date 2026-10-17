-- ==============================================================================
-- CUTLINE STUDIO: INITIAL SCHEMA & RLS POLICIES
-- Multi-tenant, isolated, approval-first video production pipeline
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. WORKSPACES (Tenancy Root)
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL DEFAULT 'Solo workspace',
    owner_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. WORKSPACE MEMBERS (Authorization)
CREATE TABLE IF NOT EXISTS workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(workspace_id, user_id)
);

-- 4. ENCRYPTED INTEGRATION VAULT (AES-256-GCM)
-- Credentials are encrypted client-side or server-side before storage.
-- Plaintext keys are NEVER persisted to this table.
CREATE TABLE IF NOT EXISTS integration_vault (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('gemini', 'pixverse', 'youtube', 'elevenlabs', 'storage', 'sentry', 'dev_mock')),
    encrypted_payload TEXT NOT NULL, -- AES-256-GCM ciphertext + IV + tag
    key_mask TEXT NOT NULL,           -- e.g. '••••••••a91f'
    key_version INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'unconfigured' CHECK (status IN ('connected', 'healthy', 'expires_soon', 'reconnect_needed', 'unconfigured', 'not_implemented', 'off_in_production')),
    model_name TEXT,
    daily_spend_cap NUMERIC(10, 2),
    last_tested_at TIMESTAMPTZ,
    last_test_latency_ms INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(workspace_id, provider)
);

-- 5. PROJECTS
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'Documentary' CHECK (category IN ('Documentary', 'Education', 'News', 'Fiction')),
    format TEXT NOT NULL DEFAULT '16:9' CHECK (format IN ('16:9', '9:16')),
    language TEXT NOT NULL DEFAULT 'English (Nigeria)',
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'In review', 'Archived', 'Draft')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. EPISODES
CREATE TABLE IF NOT EXISTS episodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    episode_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    script_content TEXT DEFAULT '',
    script_approved BOOLEAN NOT NULL DEFAULT false,
    script_version INTEGER NOT NULL DEFAULT 1,
    stage TEXT NOT NULL DEFAULT 'brief' CHECK (stage IN ('brief', 'script', 'scenes', 'render', 'assemble', 'review', 'schedule', 'published')),
    estimated_runtime_sec INTEGER DEFAULT 0,
    word_count INTEGER DEFAULT 0,
    publishing_approved BOOLEAN NOT NULL DEFAULT false,
    scheduled_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    youtube_video_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(project_id, episode_number)
);

-- 7. SCENES
CREATE TABLE IF NOT EXISTS scenes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    episode_id UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
    sequence_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    narration TEXT DEFAULT '',
    visual_prompt TEXT DEFAULT '',
    duration_sec INTEGER NOT NULL DEFAULT 5,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'needs_prompt', 'queued', 'rendering', 'rendered', 'failed', 'verified')),
    provider TEXT DEFAULT 'pixverse',
    provider_task_id TEXT,
    video_url TEXT,
    storage_path TEXT,
    sha256_hash TEXT,
    file_size_bytes BIGINT DEFAULT 0,
    is_over_limit BOOLEAN NOT NULL DEFAULT false,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(episode_id, sequence_number)
);

-- 8. PRODUCTION JOBS (Durable Queue & Leases)
CREATE TABLE IF NOT EXISTS production_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    episode_id UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
    scene_id UUID REFERENCES scenes(id) ON DELETE CASCADE,
    stage TEXT NOT NULL DEFAULT 'queued' CHECK (stage IN ('queued', 'started', 'waiting_for_provider', 'downloading', 'assembling', 'awaiting_review', 'completed', 'failed')),
    provider TEXT NOT NULL DEFAULT 'pixverse',
    provider_task_id TEXT,
    idempotency_key TEXT UNIQUE NOT NULL,
    attempt INTEGER NOT NULL DEFAULT 1,
    max_attempts INTEGER NOT NULL DEFAULT 4,
    locked_by TEXT, -- worker identity
    locked_until TIMESTAMPTZ, -- lease expiration
    is_mock BOOLEAN NOT NULL DEFAULT false,
    cost_usd NUMERIC(10, 4) NOT NULL DEFAULT 0.0000,
    cost_type TEXT NOT NULL DEFAULT 'estimated' CHECK (cost_type IN ('estimated', 'provider-reported')),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. JOB AUDIT LOGS (Redacted, append-only)
CREATE TABLE IF NOT EXISTS job_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES production_jobs(id) ON DELETE CASCADE,
    level TEXT NOT NULL DEFAULT 'info' CHECK (level IN ('info', 'warn', 'error')),
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. WORKER HEARTBEATS
CREATE TABLE IF NOT EXISTS worker_heartbeats (
    worker_id TEXT PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'healthy' CHECK (status IN ('healthy', 'draining', 'stopped')),
    last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    active_jobs_count INTEGER NOT NULL DEFAULT 0
);

-- 11. YOUTUBE CHANNELS
CREATE TABLE IF NOT EXISTS youtube_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    channel_title TEXT NOT NULL,
    channel_handle TEXT NOT NULL,
    encrypted_tokens TEXT NOT NULL,
    scopes TEXT[] NOT NULL DEFAULT ARRAY['youtube.upload', 'youtube.readonly'],
    token_status TEXT NOT NULL DEFAULT 'valid' CHECK (token_status IN ('valid', 'expires_soon', 'reconnect_needed', 'revoked')),
    daily_quota_used INTEGER NOT NULL DEFAULT 0,
    quota_reset_at TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc'::text, now()) + interval '1 day'),
    last_connected_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 12. YOUTUBE UPLOADS & RESUMABLE RECOVERY
CREATE TABLE IF NOT EXISTS youtube_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    episode_id UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES youtube_channels(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'uploading', 'interrupted', 'completed', 'failed')),
    upload_progress_pct INTEGER NOT NULL DEFAULT 0,
    bytes_uploaded BIGINT NOT NULL DEFAULT 0,
    total_bytes BIGINT NOT NULL DEFAULT 0,
    resumable_session_uri TEXT,
    youtube_video_id TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- INDEXES FOR HIGH-PERFORMANCE WORKER QUEUE & DASHBOARDS
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_projects_workspace ON projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_episodes_project ON episodes(project_id);
CREATE INDEX IF NOT EXISTS idx_scenes_episode ON scenes(episode_id);
CREATE INDEX IF NOT EXISTS idx_jobs_workspace ON production_jobs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_jobs_stage ON production_jobs(stage);
CREATE INDEX IF NOT EXISTS idx_jobs_lease ON production_jobs(locked_until, stage);
CREATE INDEX IF NOT EXISTS idx_job_logs_job ON job_logs(job_id, created_at);
CREATE INDEX IF NOT EXISTS idx_youtube_uploads_episode ON youtube_uploads(episode_id);

-- ------------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Multi-tenant isolation: Users only access data belonging to their workspace.
-- ------------------------------------------------------------------------------
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE youtube_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE youtube_uploads ENABLE ROW LEVEL SECURITY;

-- Helper function to check workspace membership
CREATE OR REPLACE FUNCTION user_in_workspace(ws_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM workspace_members
        WHERE workspace_id = ws_id AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Workspaces policy
CREATE POLICY workspaces_member_access ON workspaces
    FOR ALL
    USING (id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

-- Integration Vault policy (Only workspace owners and admins can access vault)
CREATE POLICY vault_owner_access ON integration_vault
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_id = integration_vault.workspace_id
              AND user_id = auth.uid()
              AND role IN ('owner', 'admin')
        )
    );

-- Projects policy
CREATE POLICY projects_workspace_access ON projects
    FOR ALL
    USING (user_in_workspace(workspace_id));

-- Episodes policy
CREATE POLICY episodes_workspace_access ON episodes
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = episodes.project_id
              AND user_in_workspace(projects.workspace_id)
        )
    );

-- Scenes policy
CREATE POLICY scenes_workspace_access ON scenes
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM episodes
            JOIN projects ON projects.id = episodes.project_id
            WHERE episodes.id = scenes.episode_id
              AND user_in_workspace(projects.workspace_id)
        )
    );

-- Production jobs policy
CREATE POLICY jobs_workspace_access ON production_jobs
    FOR ALL
    USING (user_in_workspace(workspace_id));

-- YouTube channels policy
CREATE POLICY youtube_channels_access ON youtube_channels
    FOR ALL
    USING (user_in_workspace(workspace_id));
