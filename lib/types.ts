/**
 * There is no formal Supabase schema file anywhere in the codebase (no
 * `supabase/migrations`, no generated `database.types.ts`) — these shapes
 * are reconstructed from the actual insert/upsert calls in
 * `ava-fit-ios/src/services/CloudSyncService.ts` and
 * `adapt-updated-2026-08-14/adapt/desktop/cloud_sync.py`. Every field beyond
 * `id`/`owner_id` is treated as optional and read defensively (see
 * lib/data.ts) so a column that doesn't exist yet, or exists only on rows
 * written by one client (iOS vs desktop), never crashes a page.
 */

export interface Patient {
  id: string;
  owner_id: string;
  name?: string | null;
  patient_code?: string | null;
  side?: string | null;
  notes?: string | null;
  grid_rows?: number | null;
  grid_cols?: number | null;
  mapping_method?: string | null;
  mapping_coverage?: number | null;
  mapping_offset?: number | null;
  pressure_unit?: string | null;
  max_kpa?: number | null;
  sample_hz?: number | null;
  device_names?: string[] | null;
  service_uuid?: string | null;
  pressure_char_uuid?: string | null;
  imu_char_uuid?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
}

export interface Session {
  id?: string;
  patient_id: string;
  owner_id: string;
  session_code?: string | null;
  source_device?: string | null;
  start_ms?: number | null;
  end_ms?: number | null;
  duration_s?: number | null;
  row_count?: number | null;
  notes?: string | null;
  created_at?: string | null;
  [key: string]: unknown;
}

export interface UserSettings {
  user_id: string;
  pressure_unit?: string | null;
  session_sample_hz?: number | null;
  num_rows?: number | null;
  num_cols?: number | null;
  max_kpa?: number | null;
  theme?: string | null;
  [key: string]: unknown;
}

/** Row in the `admin_users` table — this dashboard's own sign-in accounts,
 *  deliberately kept separate from the tester Supabase-Auth users above. */
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: string;
  created_at: string;
  last_login_at?: string | null;
}

export interface AuthUser {
  id: string;
  email?: string | null;
  created_at: string;
  last_sign_in_at?: string | null;
  email_confirmed_at?: string | null;
  user_metadata?: { full_name?: string; [key: string]: unknown };
}
