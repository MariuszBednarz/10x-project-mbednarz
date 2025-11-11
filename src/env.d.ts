/// <reference types="astro/client" />
/// <reference types="vitest/globals" />

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types/database.types";

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient<Database>;
      runtime?: {
        env?: {
          SUPABASE_SERVICE_ROLE_KEY?: string;
          [key: string]: string | undefined;
        };
      };
    }
  }
}

interface ImportMetaEnv {
  // Frontend (PUBLIC - exposed to client)
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;

  // Backend only (SECRET - never expose to client)
  readonly SUPABASE_SERVICE_ROLE_KEY: string;

  // AI Integration (not implemented yet)
  readonly OPENROUTER_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
