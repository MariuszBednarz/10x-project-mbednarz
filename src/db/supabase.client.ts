import { createClient } from "@supabase/supabase-js";

import type { Database } from "../types/database.types";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Export SupabaseClient type for use in services
export type SupabaseClient = typeof supabaseClient;
