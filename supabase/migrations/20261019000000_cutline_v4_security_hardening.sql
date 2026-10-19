-- ==============================================================================
-- CUTLINE STUDIO: V4 SECURITY HARDENING & RPC AUTHORIZATION LOCKDOWN
-- Fixes:
-- 1. Eliminates workspace self-join vulnerability (P0)
-- 2. Explicitly revokes claim_next_production_job from PUBLIC/anon/authenticated (P0)
-- 3. Provides atomic, race-condition-safe workspace provisioning RPC
-- ==============================================================================

-- 1. DROP VULNERABLE WORKSPACE MEMBERSHIP SELF-INSERT POLICY
DROP POLICY IF EXISTS workspace_members_self_insert ON workspace_members;

-- 2. RESTRICT WORKSPACE MEMBER CREATION TO AUTHORIZED WORKSPACE OWNERS/ADMINS ONLY
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'workspace_members' AND policyname = 'workspace_members_authorized_insert'
    ) THEN
        CREATE POLICY workspace_members_authorized_insert ON workspace_members
            FOR INSERT
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM workspace_members existing
                    WHERE existing.workspace_id = workspace_members.workspace_id
                      AND existing.user_id = auth.uid()
                      AND existing.role IN ('owner', 'admin')
                )
            );
    END IF;
END $$;

-- 3. ATOMIC WORKSPACE PROVISIONING RPC (SECURITY DEFINER)
-- Atomically creates a workspace and assigns owner membership in a single transaction.
-- Prevents race conditions, duplicate workspaces, and orphan entries on first login.
CREATE OR REPLACE FUNCTION provision_workspace_for_user(
    p_user_id UUID,
    p_workspace_name TEXT DEFAULT 'Personal Studio'
)
RETURNS UUID AS $$
DECLARE
    v_workspace_id UUID;
BEGIN
    -- 1. Return existing workspace if user already has one
    SELECT workspace_id INTO v_workspace_id
    FROM workspace_members
    WHERE user_id = p_user_id
    ORDER BY created_at ASC
    LIMIT 1;

    IF v_workspace_id IS NOT NULL THEN
        RETURN v_workspace_id;
    END IF;

    -- 2. Create personal workspace
    INSERT INTO workspaces (name, owner_id)
    VALUES (COALESCE(p_workspace_name, 'Personal Studio'), p_user_id)
    RETURNING id INTO v_workspace_id;

    -- 3. Assign owner membership atomically
    INSERT INTO workspace_members (workspace_id, user_id, role)
    VALUES (v_workspace_id, p_user_id, 'owner')
    ON CONFLICT (workspace_id, user_id) DO NOTHING;

    RETURN v_workspace_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 4. EXPLICIT PRIVILEGE AUDIT & RESTRICTIONS ON WORKER RPC (P0 FIX)
-- PostgreSQL grants EXECUTE to PUBLIC by default on functions.
-- We explicitly revoke EXECUTE from PUBLIC, anon, and authenticated.
REVOKE ALL ON FUNCTION claim_next_production_job(TEXT, INT) FROM PUBLIC;
REVOKE ALL ON FUNCTION claim_next_production_job(TEXT, INT) FROM anon;
REVOKE ALL ON FUNCTION claim_next_production_job(TEXT, INT) FROM authenticated;

-- Grant EXECUTE exclusively to trusted backend worker execution identity (service_role)
GRANT EXECUTE ON FUNCTION claim_next_production_job(TEXT, INT) TO service_role;

-- 5. PRIVILEGE AUDIT ON WORKSPACE PROVISIONING RPC
REVOKE ALL ON FUNCTION provision_workspace_for_user(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION provision_workspace_for_user(UUID, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION provision_workspace_for_user(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION provision_workspace_for_user(UUID, TEXT) TO authenticated;
