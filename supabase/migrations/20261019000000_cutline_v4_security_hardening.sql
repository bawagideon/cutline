-- ==============================================================================
-- CUTLINE STUDIO: V4 SECURITY HARDENING & RPC AUTHORIZATION LOCKDOWN
-- Fixes:
-- 1. Eliminates workspace self-join vulnerability and RLS infinite recursion (P0)
-- 2. Closes membership oracle: Derives caller strictly from auth.uid() in helper
-- 3. Explicitly revokes claim_next_production_job from PUBLIC/anon/authenticated (P0)
-- 4. Locks down provision_workspace_for_user strictly to service_role (P0)
-- 5. Implements claim fencing and lease recovery in claim_next_production_job
-- ==============================================================================

-- 1. DROP VULNERABLE & RECURSIVE WORKSPACE MEMBERSHIP POLICIES
DROP POLICY IF EXISTS workspace_members_self_insert ON public.workspace_members;
DROP POLICY IF EXISTS workspace_members_authorized_insert ON public.workspace_members;

-- 2. PRIVILEGED SERVER-SIDE ROLE CHECK HELPER (SERVICE ROLE ONLY)
-- Restrict two-parameter version strictly to service_role to eliminate membership oracle.
CREATE OR REPLACE FUNCTION public.is_workspace_admin_or_owner(
    p_workspace_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    IF p_workspace_id IS NULL OR p_user_id IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM public.workspace_members
        WHERE workspace_id = p_workspace_id
          AND user_id = p_user_id
          AND role IN ('owner', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.is_workspace_admin_or_owner(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_workspace_admin_or_owner(UUID, UUID) FROM anon;
REVOKE ALL ON FUNCTION public.is_workspace_admin_or_owner(UUID, UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.is_workspace_admin_or_owner(UUID, UUID) TO service_role;

-- 3. CLIENT-SAFE SECURITY DEFINER ROLE CHECK HELPER (CALLER IDENTITY PINNED TO auth.uid())
-- Eliminates membership oracle by strictly preventing arbitrary user identity probing.
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

REVOKE ALL ON FUNCTION public.is_current_user_workspace_admin_or_owner(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_current_user_workspace_admin_or_owner(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_current_user_workspace_admin_or_owner(UUID) TO authenticated, service_role;

-- 4. RESTRICT WORKSPACE MEMBER INSERTION VIA NON-RECURSIVE CLIENT-SAFE POLICY
CREATE POLICY workspace_members_authorized_insert ON public.workspace_members
    FOR INSERT
    WITH CHECK (
        public.is_current_user_workspace_admin_or_owner(workspace_id)
    );

-- 5. ATOMIC WORKSPACE PROVISIONING RPC (SERVICE ROLE ONLY)
-- Accepts caller identity ONLY when executed by the trusted server-side service_role.
-- Plain authenticated clients CANNOT execute this RPC with arbitrary identities.
CREATE OR REPLACE FUNCTION public.provision_workspace_for_user(
    p_user_id UUID,
    p_workspace_name TEXT DEFAULT 'Personal Studio'
)
RETURNS UUID AS $$
DECLARE
    v_workspace_id UUID;
BEGIN
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'p_user_id cannot be null';
    END IF;

    -- 1. Return existing workspace if user already belongs to one
    SELECT workspace_id INTO v_workspace_id
    FROM public.workspace_members
    WHERE user_id = p_user_id
    ORDER BY created_at ASC
    LIMIT 1;

    IF v_workspace_id IS NOT NULL THEN
        RETURN v_workspace_id;
    END IF;

    -- 2. Atomically create personal workspace
    INSERT INTO public.workspaces (name, owner_id)
    VALUES (COALESCE(p_workspace_name, 'Personal Studio'), p_user_id)
    RETURNING id INTO v_workspace_id;

    -- 3. Assign owner membership atomically
    INSERT INTO public.workspace_members (workspace_id, user_id, role)
    VALUES (v_workspace_id, p_user_id, 'owner')
    ON CONFLICT (workspace_id, user_id) DO NOTHING;

    RETURN v_workspace_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Explicitly revoke from PUBLIC, anon, AND authenticated (P0 FIX)
REVOKE ALL ON FUNCTION public.provision_workspace_for_user(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.provision_workspace_for_user(UUID, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.provision_workspace_for_user(UUID, TEXT) FROM authenticated;
-- Grant strictly and exclusively to service_role
GRANT EXECUTE ON FUNCTION public.provision_workspace_for_user(UUID, TEXT) TO service_role;

-- 6. CLIENT-FACING PROVISIONING FUNCTION (DERIVES IDENTITY SOLELY FROM auth.uid())
-- Authenticated users can only provision a workspace for THEMSELVES. No arbitrary identity allowed.
CREATE OR REPLACE FUNCTION public.provision_my_workspace(
    p_workspace_name TEXT DEFAULT 'Personal Studio'
)
RETURNS UUID AS $$
DECLARE
    v_caller_id UUID := auth.uid();
BEGIN
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Unauthenticated caller cannot provision workspace';
    END IF;

    RETURN public.provision_workspace_for_user(v_caller_id, p_workspace_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.provision_my_workspace(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.provision_my_workspace(TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.provision_my_workspace(TEXT) TO authenticated, service_role;

-- 7. ATOMIC WORKER CLAIM FUNCTION WITH FOR UPDATE SKIP LOCKED & FENCING TOKENS
CREATE OR REPLACE FUNCTION public.claim_next_production_job(
    p_worker_id TEXT,
    p_lease_sec INT
)
RETURNS SETOF public.production_jobs AS $$
DECLARE
    v_job_id UUID;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
    v_lease_until TIMESTAMPTZ := v_now + (p_lease_sec || ' seconds')::INTERVAL;
BEGIN
    -- Atomically lock the oldest eligible job using FOR UPDATE SKIP LOCKED.
    -- Strict lease check: must be queued OR lease has strictly lapsed (< v_now).
    SELECT id INTO v_job_id
    FROM public.production_jobs
    WHERE stage = 'queued' 
       OR (stage NOT IN ('completed', 'failed') AND (locked_until IS NULL OR locked_until < v_now))
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    IF v_job_id IS NULL THEN
        RETURN;
    END IF;

    -- Update lease, increment attempt as claim fencing token, and return claimed job
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

-- Revoke all permissions on worker claim function from untrusted roles
REVOKE ALL ON FUNCTION public.claim_next_production_job(TEXT, INT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_next_production_job(TEXT, INT) FROM anon;
REVOKE ALL ON FUNCTION public.claim_next_production_job(TEXT, INT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.claim_next_production_job(TEXT, INT) TO service_role;
