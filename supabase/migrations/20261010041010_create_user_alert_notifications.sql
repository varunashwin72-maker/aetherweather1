/*
# Create user_alert_notifications table

## Purpose
Stores weather alert notifications per user so they can see a history of alerts
for their area and mark them as read. This powers the notification system that
fires when weather alerts are detected for the user's location.

## New Tables
- `user_alert_notifications`
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, defaults to auth.uid(), references auth.users)
  - `alert_id` (text, not null) — the derived alert key (e.g. "uv-5128581")
  - `title` (text, not null) — alert title
  - `description` (text, not null) — alert description
  - `severity` (text, not null) — one of: extreme, severe, moderate, minor, unknown
  - `location_name` (text, not null) — the location the alert applies to
  - `is_read` (boolean, default false) — whether the user has dismissed/read it
  - `created_at` (timestamptz, default now())

## Security
- Enable RLS on `user_alert_notifications`.
- Owner-scoped CRUD: each authenticated user can only access their own notifications.
- INSERT has a WITH CHECK on auth.uid() = user_id.
- UPDATE allows marking own notifications as read.
- DELETE allows removing own notifications.
- SELECT restricted to owner only.

## Important Notes
1. The `user_id` column defaults to `auth.uid()` so inserts from the frontend
   that omit user_id still satisfy the RLS WITH CHECK.
2. A unique constraint on (user_id, alert_id) prevents duplicate notifications
   for the same alert being stored multiple times.
3. An index on (user_id, is_read) supports efficient "unread count" queries.
*/

CREATE TABLE IF NOT EXISTS user_alert_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_id text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  severity text NOT NULL DEFAULT 'unknown',
  location_name text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_alert_notifications_unique
  ON user_alert_notifications (user_id, alert_id);

CREATE INDEX IF NOT EXISTS idx_user_alert_notifications_unread
  ON user_alert_notifications (user_id, is_read)
  WHERE is_read = false;

ALTER TABLE user_alert_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_notifications" ON user_alert_notifications;
CREATE POLICY "select_own_notifications"
  ON user_alert_notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_notifications" ON user_alert_notifications;
CREATE POLICY "insert_own_notifications"
  ON user_alert_notifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_notifications" ON user_alert_notifications;
CREATE POLICY "update_own_notifications"
  ON user_alert_notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_notifications" ON user_alert_notifications;
CREATE POLICY "delete_own_notifications"
  ON user_alert_notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
