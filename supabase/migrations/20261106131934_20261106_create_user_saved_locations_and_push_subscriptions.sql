/*
# Create user_saved_locations and user_push_subscriptions tables

## Purpose
1. `user_saved_locations` — stores the locations each user cares about
   (favorites + the last place they searched) so that weather alerts can be
   checked for ALL of the user's locations, not just the one currently open
   in the browser.
2. `user_push_subscriptions` — stores Web Push subscription endpoints per
   device so that an edge function can deliver early weather alerts directly
   to the notification center of the specific device (phone/laptop) where the
   user last used the site.
3. `user_alert_check_log` — deduplication table so the alert checker does not
   re-notify the same alert for the same location more than once per active
   period. (The existing user_alert_notifications table stores the
   user-facing notifications; this table tracks which alert+location combos
   have already been dispatched via push.)

## New Tables

### user_saved_locations
- `id` (uuid, primary key)
- `user_id` (uuid, not null, defaults to auth.uid(), references auth.users, cascade delete)
- `location_id` (text, not null) — stable id from the geocoder (e.g. "om-5128581")
- `name` (text, not null) — display name (e.g. "New York")
- `region` (text) — region/state
- `country` (text) — country
- `latitude` (double precision, not null)
- `longitude` (double precision, not null)
- `is_favorite` (boolean, default false) — true for favorites, false for last-searched
- `is_last_searched` (boolean, default false) — true for the most recently searched location
- `updated_at` (timestamptz, default now())

### user_push_subscriptions
- `id` (uuid, primary key)
- `user_id` (uuid, not null, defaults to auth.uid(), references auth.users, cascade delete)
- `endpoint` (text, not null) — the push service endpoint URL (unique per device/browser)
- `p256dh` (text, not null) — public key for push encryption
- `auth` (text, not null) — auth secret for push encryption
- `device_label` (text) — optional human label (e.g. "Chrome on Mac")
- `created_at` (timestamptz, default now())

### user_alert_check_log
- `id` (uuid, primary key)
- `user_id` (uuid, not null, references auth.users, cascade delete)
- `alert_key` (text, not null) — composite key like "uv:om-5128581"
- `location_id` (text, not null)
- `notified_at` (timestamptz, default now())

## Security
- Enable RLS on all three tables.
- Owner-scoped CRUD: each authenticated user can only access their own rows.
- GRANT SELECT, INSERT, UPDATE, DELETE to authenticated on
  user_saved_locations and user_push_subscriptions.
- GRANT SELECT, INSERT to authenticated on user_alert_check_log (users
  only read/insert; cleanup is server-side).
- GRANT SELECT, INSERT, DELETE to service_role on all three tables so the
  edge function (which uses the service role key) can read locations,
  subscriptions, and manage the check log.
- user_push_subscriptions: users can DELETE their own subscriptions
  (to unsubscribe a device).

## Important Notes
1. user_id columns default to auth.uid() so frontend inserts that omit
   user_id still satisfy RLS WITH CHECK.
2. Unique constraint on user_push_subscriptions(endpoint) prevents duplicate
   device registrations per endpoint.
3. Unique constraint on (user_id, location_id) in user_saved_locations means
   each location appears once per user; is_favorite and is_last_searched
   flags distinguish role.
4. Unique constraint on (user_id, alert_key) in user_alert_check_log
   prevents re-notifying the same alert repeatedly.
5. Indexes support the common query patterns: "all locations for a user"
   and "all subscriptions for a user".
*/

-- user_saved_locations
CREATE TABLE IF NOT EXISTS user_saved_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  location_id text NOT NULL,
  name text NOT NULL,
  region text,
  country text,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  is_favorite boolean NOT NULL DEFAULT false,
  is_last_searched boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_saved_locations_user_loc
  ON user_saved_locations (user_id, location_id);

CREATE INDEX IF NOT EXISTS idx_user_saved_locations_user
  ON user_saved_locations (user_id);

ALTER TABLE user_saved_locations ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON user_saved_locations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_saved_locations TO service_role;

DROP POLICY IF EXISTS "select_own_saved_locations" ON user_saved_locations;
CREATE POLICY "select_own_saved_locations"
  ON user_saved_locations FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_saved_locations" ON user_saved_locations;
CREATE POLICY "insert_own_saved_locations"
  ON user_saved_locations FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_saved_locations" ON user_saved_locations;
CREATE POLICY "update_own_saved_locations"
  ON user_saved_locations FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_saved_locations" ON user_saved_locations;
CREATE POLICY "delete_own_saved_locations"
  ON user_saved_locations FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- user_push_subscriptions
CREATE TABLE IF NOT EXISTS user_push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  device_label text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint
  ON user_push_subscriptions (endpoint);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user
  ON user_push_subscriptions (user_id);

ALTER TABLE user_push_subscriptions ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, DELETE ON user_push_subscriptions TO authenticated;
GRANT SELECT, INSERT, DELETE ON user_push_subscriptions TO service_role;

DROP POLICY IF EXISTS "select_own_push_subs" ON user_push_subscriptions;
CREATE POLICY "select_own_push_subs"
  ON user_push_subscriptions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_push_subs" ON user_push_subscriptions;
CREATE POLICY "insert_own_push_subs"
  ON user_push_subscriptions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_push_subs" ON user_push_subscriptions;
CREATE POLICY "delete_own_push_subs"
  ON user_push_subscriptions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- user_alert_check_log
CREATE TABLE IF NOT EXISTS user_alert_check_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_key text NOT NULL,
  location_id text NOT NULL,
  notified_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_alert_check_log_user_key
  ON user_alert_check_log (user_id, alert_key);

CREATE INDEX IF NOT EXISTS idx_alert_check_log_location
  ON user_alert_check_log (location_id);

ALTER TABLE user_alert_check_log ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON user_alert_check_log TO authenticated;
GRANT SELECT, INSERT, DELETE ON user_alert_check_log TO service_role;

DROP POLICY IF EXISTS "select_own_check_log" ON user_alert_check_log;
CREATE POLICY "select_own_check_log"
  ON user_alert_check_log FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_check_log" ON user_alert_check_log;
CREATE POLICY "insert_own_check_log"
  ON user_alert_check_log FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
