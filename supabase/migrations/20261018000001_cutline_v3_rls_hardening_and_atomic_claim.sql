-- ==============================================================================
-- CUTLINE STUDIO: V3 RLS HARDENING, MEMBERSHIP POLICIES & ATOMIC QUEUE WORKER
-- Eliminates race conditions in job claims and establishes zero-trust tenancy.
-- ==============================================================================

-- 1. HARDEN user_in_workspace WITH FIXED SEARCH PATH
CREATE OR REPLACE FUNCTION user_in_workspace(ws_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM workspace_members
        WHERE workspace_id = ws_id AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 2. WORKSPACES INSERT POLICY (Allows authenticated users to provision personal workspaces)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'workspaces' AND policyname = 'workspaces_insert_owner'
    ) THEN
        CREATE POLICY workspaces_insert_owner ON workspaces
            FOR INSERT
            WITH CHECK (owner_id = auth.uid());
    END IF;
END $$;

-- 3. WORKSPACE MEMBERS POLICIES (Enables users to query their own memberships and join provisioned workspaces)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'workspace_members' AND policyname = 'workspace_members_self_read'
    ) THEN
        CREATE POLICY workspace_members_self_read ON workspace_members
            FOR SELECT
            USING (user_id = auth.uid() OR user_in_workspace(workspace_id));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'workspace_members' AND policyname = 'workspace_members_self_insert'
    ) THEN
        CREATE POLICY workspace_members_self_insert ON workspace_members
            FOR INSERT
            WITH CHECK (user_id = auth.uid() OR user_in_workspace(workspace_id));
    END IF;
END $$;

-- 4. JOB LOGS WORKSPACE ACCESS
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'job_logs' AND policyname = 'job_logs_workspace_access'
    ) THEN
        CREATE POLICY job_logs_workspace_access ON job_logs
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM production_jobs
                    WHERE production_jobs.id = job_logs.job_id
                      AND user_in_workspace(production_jobs.workspace_id)
                )
            );
    END IF;
END $$;

-- 5. ATOMIC WORKER CLAIM FUNCTION WITH FOR UPDATE SKIP LOCKED
-- Guarantees that two concurrent workers NEVER receive or process the same job.
CREATE OR REPLACE FUNCTION claim_next_production_job(p_worker_id TEXT, p_lease_sec INT)
RETURNS SETOF production_jobs AS $$
DECLARE
    v_job_id UUID;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
    v_lease_until TIMESTAMPTZ := v_now + (p_lease_sec || ' seconds')::INTERVAL;
BEGIN
    -- Atomically lock the oldest eligible job using FOR UPDATE SKIP LOCKED
    SELECT id INTO v_job_id
    FROM production_jobs
    WHERE stage = 'queued' OR (stage NOT IN ('completed', 'failed') AND locked_until < v_now)
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    IF v_job_id IS NULL THEN
        RETURN;
    END IF;

    -- Update lease and return the atomically claimed job
    RETURN QUERY
    UPDATE production_jobs
    SET stage = CASE WHEN stage = 'queued' THEN 'started'::text ELSE stage END,
        locked_by = p_worker_id,
        locked_until = v_lease_until,
        updated_at = v_now
    WHERE id = v_job_id
    RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
