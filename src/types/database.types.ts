/**
 * Database Types
 *
 * Auto-generated types based on Supabase schema
 * Generated from migrations: 20250123000000 - 20250123000009
 *
 * To regenerate:
 * npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.types.ts
 *
 * @see supabase/README.md for type synchronization guide
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      hospital_wards: {
        Row: {
          id: string;
          wardName: string;
          wardLink: string | null;
          district: string | null;
          hospitalName: string;
          availablePlaces: string;
          lastUpdated: string | null;
          scrapedAt: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          wardName: string;
          wardLink?: string | null;
          district?: string | null;
          hospitalName: string;
          availablePlaces?: string;
          lastUpdated?: string | null;
          scrapedAt: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          wardName?: string;
          wardLink?: string | null;
          district?: string | null;
          hospitalName?: string;
          availablePlaces?: string;
          lastUpdated?: string | null;
          scrapedAt?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_favorites: {
        Row: {
          id: string;
          user_id: string;
          ward_name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          ward_name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          ward_name?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_favorites_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_insights: {
        Row: {
          id: string;
          insight_text: string;
          generated_at: string;
          expires_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          insight_text: string;
          generated_at?: string;
          expires_at: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          insight_text?: string;
          generated_at?: string;
          expires_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      scraping_logs: {
        Row: {
          id: string;
          started_at: string;
          completed_at: string | null;
          status: "success" | "failure";
          records_inserted: number;
          records_updated: number;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          started_at?: string;
          completed_at?: string | null;
          status: "success" | "failure";
          records_inserted?: number;
          records_updated?: number;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          started_at?: string;
          completed_at?: string | null;
          status?: "success" | "failure";
          records_inserted?: number;
          records_updated?: number;
          error_message?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      is_data_stale: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      get_last_scrape_time: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      count_unique_wards: {
        Args: Record<PropertyKey, never>;
        Returns: number; // PostgreSQL INTEGER (INT4) -> TypeScript number
      };
      count_unique_hospitals: {
        Args: Record<PropertyKey, never>;
        Returns: number; // PostgreSQL INTEGER (INT4) -> TypeScript number
      };
      calculate_scraping_success_rate: {
        Args: {
          days?: number;
        };
        Returns: number;
      };
      get_total_places_by_ward: {
        Args: {
          p_ward_name: string;
        };
        Returns: number;
      };
      get_wards_aggregated: {
        Args: {
          p_search?: string | null;
          p_user_id?: string | null;
          p_favorites_only?: boolean;
        };
        Returns: {
          wardName: string;
          hospitalCount: number;
          totalPlaces: number;
          isFavorite: boolean;
          lastScrapedAt: string;
        }[];
      };
      get_user_favorites_with_stats: {
        Args: Record<PropertyKey, never>;
        Returns: {
          id: string;
          wardName: string;
          hospitalCount: number;
          totalPlaces: number;
          createdAt: string;
        }[];
      };
      cleanup_orphaned_favorites: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      update_updated_at_column: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      get_system_status: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      get_unique_districts: {
        Args: Record<PropertyKey, never>;
        Returns: {
          district: string;
        }[];
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}

// Type helper for SupabaseClient
export type SupabaseClient = import("@supabase/supabase-js").SupabaseClient<Database>;
