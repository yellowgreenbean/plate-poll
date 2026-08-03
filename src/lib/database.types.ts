export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      departments: {
        Row: {
          created_at: string
          id: string
          name: string
          org_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          org_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          email_domain: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          email_domain: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          email_domain?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          dept_id: string
          email: string
          id: string
          name: string | null
          org_id: string
        }
        Insert: {
          created_at?: string
          dept_id: string
          email: string
          id: string
          name?: string | null
          org_id: string
        }
        Update: {
          created_at?: string
          dept_id?: string
          email?: string
          id?: string
          name?: string | null
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_dept_id_fkey"
            columns: ["dept_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          address: string | null
          category: string | null
          created_at: string
          created_by: string | null
          id: number
          kakao_place_id: string | null
          lat: number | null
          lng: number | null
          name: string
          place_url: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          id?: never
          kakao_place_id?: string | null
          lat?: number | null
          lng?: number | null
          name: string
          place_url?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          id?: never
          kakao_place_id?: string | null
          lat?: number | null
          lng?: number | null
          name?: string
          place_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurants_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vote_options: {
        Row: {
          created_at: string
          id: string
          restaurant_id: number
          vote_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          restaurant_id: number
          vote_id: string
        }
        Update: {
          created_at?: string
          id?: string
          restaurant_id?: number
          vote_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vote_options_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vote_options_vote_id_fkey"
            columns: ["vote_id"]
            isOneToOne: false
            referencedRelation: "votes"
            referencedColumns: ["id"]
          },
        ]
      }
      vote_responses: {
        Row: {
          created_at: string
          id: string
          option_id: string
          points: number | null
          rank: number
          user_id: string
          vote_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_id: string
          points?: number | null
          rank: number
          user_id: string
          vote_id: string
        }
        Update: {
          created_at?: string
          id?: string
          option_id?: string
          points?: number | null
          rank?: number
          user_id?: string
          vote_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vote_responses_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "vote_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vote_responses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vote_responses_vote_id_fkey"
            columns: ["vote_id"]
            isOneToOne: false
            referencedRelation: "votes"
            referencedColumns: ["id"]
          },
        ]
      }
      votes: {
        Row: {
          closes_at: string
          created_at: string
          created_by: string
          dept_id: string
          id: string
          status: string
          title: string | null
        }
        Insert: {
          closes_at: string
          created_at?: string
          created_by: string
          dept_id: string
          id?: string
          status?: string
          title?: string | null
        }
        Update: {
          closes_at?: string
          created_at?: string
          created_by?: string
          dept_id?: string
          id?: string
          status?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "votes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_dept_id_fkey"
            columns: ["dept_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_signup: {
        Args: { p_dept_id?: string; p_name?: string; p_new_dept_name?: string }
        Returns: {
          created_at: string
          dept_id: string
          email: string
          id: string
          name: string | null
          org_id: string
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_vote: {
        Args: {
          p_closes_at: string
          p_restaurant_ids: number[]
          p_title: string
        }
        Returns: {
          closes_at: string
          created_at: string
          created_by: string
          dept_id: string
          id: string
          status: string
          title: string | null
        }
        SetofOptions: {
          from: "*"
          to: "votes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      current_profile: {
        Args: never
        Returns: {
          dept_id: string
          org_id: string
        }[]
      }
      get_rankings: {
        Args: { p_dept_id?: string; p_org_id?: string; p_scope: string }
        Returns: {
          restaurant_id: number
          restaurant_name: string
          rnk: number
          total_points: number
          total_votes: number
        }[]
      }
      get_vote_results: {
        Args: { p_vote_id: string }
        Returns: {
          is_closed: boolean
          restaurant_id: number
          restaurant_name: string
          rnk: number
          total_points: number
          total_votes: number
        }[]
      }
      submit_vote_response: {
        Args: { p_option_ids: string[]; p_vote_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
