-- ============================================================================
-- Notifications Table Migration
-- ============================================================================
-- This migration creates the notifications table for in-app notifications,
-- specifically for claim status updates (approved/denied).
--
-- Security Model:
-- - Users can only read their own notifications (recipient_user_id = clerk_user_id)
-- - Users can update their own notifications (mark as read)
-- - Notifications are created server-side via admin client (bypasses RLS)
-- ============================================================================

-- Notifications table: Stores in-app notifications for users
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_user_id TEXT NOT NULL, -- clerk_user_id of the notification recipient
    title TEXT NOT NULL, -- e.g., "Claim Approved", "Claim Denied"
    body TEXT NOT NULL, -- Short message, e.g., item name
    type TEXT NOT NULL CHECK (type IN ('claim_approved', 'claim_denied')), -- Notification type
    item_id UUID REFERENCES items(id) ON DELETE CASCADE, -- Related item (nullable)
    claim_id UUID REFERENCES claims(id) ON DELETE CASCADE, -- Related claim (nullable)
    read_at TIMESTAMPTZ, -- When the notification was read (null = unread)
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for fetching unread notifications for a user (most common query)
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread 
    ON notifications(recipient_user_id, read_at) 
    WHERE read_at IS NULL;

-- Index for fetching recent notifications for a user (ordered by created_at)
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created 
    ON notifications(recipient_user_id, created_at DESC);

-- Index for claim_id lookups (for cleanup/deletion)
CREATE INDEX IF NOT EXISTS idx_notifications_claim_id 
    ON notifications(claim_id) 
    WHERE claim_id IS NOT NULL;

-- Index for item_id lookups (for cleanup/deletion)
CREATE INDEX IF NOT EXISTS idx_notifications_item_id 
    ON notifications(item_id) 
    WHERE item_id IS NOT NULL;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================
-- Security Model:
-- - Users can only read their own notifications
-- - Users can only update their own notifications (to mark as read)
-- - Notifications are created server-side via admin client (bypasses RLS)

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications
DROP POLICY IF EXISTS "Users can read their own notifications" ON notifications;
CREATE POLICY "Users can read their own notifications"
    ON notifications FOR SELECT
    USING (
        recipient_user_id = current_setting('app.current_user_id', TRUE)
    );

-- Users can update their own notifications (to mark as read)
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    USING (
        recipient_user_id = current_setting('app.current_user_id', TRUE)
    )
    WITH CHECK (
        recipient_user_id = current_setting('app.current_user_id', TRUE)
    );

-- Note: INSERT is not allowed via RLS - notifications are created server-side
-- using the admin client to bypass RLS for security and performance
