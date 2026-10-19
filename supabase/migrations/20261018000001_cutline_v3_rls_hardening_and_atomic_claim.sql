-- ==============================================================================
-- CUTLINE STUDIO: V3 RLS HARDENING, MEMBERSHIP POLICIES & ATOMIC QUEUE WORKER
-- Eliminates race conditions in job claims and establishes zero-trust tenancy.
-- ==============================================================================

-- 1. HARDEN user_in_workspace WITH FIXED SEARCH PATH
CREATE OR REPLACE FUNCTION public.user_in_workspace(ws_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.workspace_members
        WHERE workspace_id = ws_id AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 2. CREATE NON-RECURSIVE SECURITY DEFINER ROLE CHECK HELPER (CLIENT SAFE)
CREATE OR REPLACE FUNCTION public.is_current_user_workspace_admin_or_owner(
    p_workspace_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_caller_id UUID := auth.uid();
BEGIN
    IF p_workspace_id IS NULL OR v_caller_id IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM public.workspace_members
        WHERE workspace_id = p_workspace_id
          AND user_id = v_caller_id
          AND role IN ('owner', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 3. WORKSPACES INSERT POLICY (Allows authenticated users to provision personal workspaces)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'workspaces' AND policyname = 'workspaces_insert_owner'
    ) THEN
        CREATE POLICY workspaces_insert_owner ON public.workspaces
            FOR INSERT
            WITH CHECK (owner_id = auth.uid());
    END IF;
END $$;

-- 4. WORKSPACE MEMBERS POLICIES (Enables users to query their own memberships and join provisioned workspaces)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'workspace_members' AND policyname = 'workspace_members_self_read'
    ) THEN
        CREATE POLICY workspace_members_self_read ON public.workspace_members
            FOR SELECT
            USING (user_id = auth.uid() OR public.user_in_workspace(workspace_id));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'workspace_members' AND policyname = 'workspace_members_authorized_insert'
    ) THEN
        CREATE POLICY workspace_members_authorized_insert ON public.workspace_members
            FOR INSERT
            WITH CHECK (public.is_current_user_workspace_admin_or_owner(workspace_id));
    END IF;
END $$;

-- 5. JOB LOGS WORKSPACE ACCESS
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'job_logs' AND policyname = 'job_logs_workspace_access'
    ) THEN
        CREATE POLICY job_logs_workspace_access ON public.job_logs
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM public.production_jobs
                    WHERE public.production_jobs.id = public.job_logs.job_id
                      AND public.user_in_workspace(public.production_jobs.workspace_id)
                )
            );
    END IF;
END $$;

-- 6. ATOMIC WORKER CLAIM FUNCTION WITH FOR UPDATE SKIP LOCKED & FENCING
CREATE OR REPLACE FUNCTION public.claim_next_production_job(p_worker_id TEXT, p_lease_sec INT)
RETURNS SETOF public.production_jobs AS $$
DECLARE
    v_job_id UUID;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
    v_lease_until TIMESTAMPTZ := v_now + (p_lease_sec || ' seconds')::INTERVAL;
BEGIN
    -- Atomically lock the oldest eligible job using FOR UPDATE SKIP LOCKED
    SELECT id INTO v_job_id
    FROM public.production_jobs
    WHERE stage = 'queued' OR (stage NOT IN ('completed', 'failed') AND (locked_until IS NULL OR locked_until < v_now))
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    IF v_job_id IS NULL THEN
        RETURN;
    END IF;

    -- Update lease and return the atomically claimed job
    RETURN QUERY
    UPDATE public.production_jobs
    SET stage = CASE WHEN stage = 'queued' THEN 'started'::text ELSE stage END,
        locked_by = p_worker_id,
        locked_until = v_lease_until,
        attempt = attempt + 1,
        updated_at = v_now
    WHERE id = v_job_id
    RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 7. EXPLICIT PRIVILEGE AUDIT & RESTRICTIONS ON WORKER RPC
REVOKE ALL ON FUNCTION public.claim_next_production_job(TEXT, INT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_next_production_job(TEXT, INT) FROM anon;
REVOKE ALL ON FUNCTION public.claim_next_production_job(TEXT, INT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.claim_next_production_job(TEXT, INT) TO service_role;
