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
      assessment_answers: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          question_id: string
          selected_answer: number
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          question_id: string
          selected_answer: number
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          question_id?: string
          selected_answer?: number
        }
        Relationships: [
          {
            foreignKeyName: "assessment_answers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      github_activity: {
        Row: {
          active_days: number
          commits_count: number
          created_at: string
          github_profile_id: string
          id: string
          issues_count: number
          period_end: string
          period_start: string
          prs_count: number
        }
        Insert: {
          active_days?: number
          commits_count?: number
          created_at?: string
          github_profile_id: string
          id?: string
          issues_count?: number
          period_end: string
          period_start: string
          prs_count?: number
        }
        Update: {
          active_days?: number
          commits_count?: number
          created_at?: string
          github_profile_id?: string
          id?: string
          issues_count?: number
          period_end?: string
          period_start?: string
          prs_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "github_activity_github_profile_id_fkey"
            columns: ["github_profile_id"]
            isOneToOne: false
            referencedRelation: "github_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      github_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          github_user_id: number
          id: string
          last_synced_at: string | null
          profile_bio: string | null
          profile_id: string
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          github_user_id: number
          id?: string
          last_synced_at?: string | null
          profile_bio?: string | null
          profile_id: string
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          github_user_id?: number
          id?: string
          last_synced_at?: string | null
          profile_bio?: string | null
          profile_id?: string
          updated_at?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "github_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      github_repositories: {
        Row: {
          created_at: string
          description: string | null
          forks: number
          github_profile_id: string
          github_repo_id: number
          id: string
          is_fork: boolean
          is_private: boolean
          languages: Json
          name: string
          repo_created_at: string | null
          repo_updated_at: string | null
          stars: number
          topics: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          forks?: number
          github_profile_id: string
          github_repo_id: number
          id?: string
          is_fork?: boolean
          is_private?: boolean
          languages?: Json
          name: string
          repo_created_at?: string | null
          repo_updated_at?: string | null
          stars?: number
          topics?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          forks?: number
          github_profile_id?: string
          github_repo_id?: number
          id?: string
          is_fork?: boolean
          is_private?: boolean
          languages?: Json
          name?: string
          repo_created_at?: string | null
          repo_updated_at?: string | null
          stars?: number
          topics?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "github_repositories_github_profile_id_fkey"
            columns: ["github_profile_id"]
            isOneToOne: false
            referencedRelation: "github_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_drafts: {
        Row: {
          body: string
          channel: string
          citations: Json
          created_at: string
          id: string
          lead_id: string
          model: string | null
          prompt_version: string
          status: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          body: string
          channel: string
          citations?: Json
          created_at?: string
          id?: string
          lead_id: string
          model?: string | null
          prompt_version: string
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          body?: string
          channel?: string
          citations?: Json
          created_at?: string
          id?: string
          lead_id?: string
          model?: string | null
          prompt_version?: string
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_drafts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_generation_receipts: {
        Row: {
          created_at: string
          dedup_key: string
          detected_event_id: string
          github_profile_id: string
          id: string
          lead_id: string | null
          profile_id: string
        }
        Insert: {
          created_at?: string
          dedup_key: string
          detected_event_id: string
          github_profile_id: string
          id?: string
          lead_id?: string | null
          profile_id: string
        }
        Update: {
          created_at?: string
          dedup_key?: string
          detected_event_id?: string
          github_profile_id?: string
          id?: string
          lead_id?: string | null
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_generation_receipts_detected_event_id_fkey"
            columns: ["detected_event_id"]
            isOneToOne: false
            referencedRelation: "github_detected_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_generation_receipts_github_profile_id_fkey"
            columns: ["github_profile_id"]
            isOneToOne: false
            referencedRelation: "github_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_generation_receipts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_generation_receipts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          angle: string
          confidence: number | null
          created_at: string
          dedup_key: string
          detected_event_id: string | null
          expires_at: string | null
          generated_at: string
          github_profile_id: string
          id: string
          profile_id: string
          relevant_skills: string[]
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          angle: string
          confidence?: number | null
          created_at?: string
          dedup_key: string
          detected_event_id?: string | null
          expires_at?: string | null
          generated_at?: string
          github_profile_id: string
          id?: string
          profile_id: string
          relevant_skills?: string[]
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          angle?: string
          confidence?: number | null
          created_at?: string
          dedup_key?: string
          detected_event_id?: string | null
          expires_at?: string | null
          generated_at?: string
          github_profile_id?: string
          id?: string
          profile_id?: string
          relevant_skills?: string[]
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_detected_event_id_fkey"
            columns: ["detected_event_id"]
            isOneToOne: false
            referencedRelation: "github_detected_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_github_profile_id_fkey"
            columns: ["github_profile_id"]
            isOneToOne: false
            referencedRelation: "github_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_interests: {
        Row: {
          created_at: string
          id: string
          interest: string
          profile_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interest: string
          profile_id: string
        }
        Update: {
          created_at?: string
          id?: string
          interest?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_interests_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_skills: {
        Row: {
          confidence: string
          created_at: string
          id: string
          profile_id: string
          skill: string
        }
        Insert: {
          confidence: string
          created_at?: string
          id?: string
          profile_id: string
          skill: string
        }
        Update: {
          confidence?: string
          created_at?: string
          id?: string
          profile_id?: string
          skill?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_skills_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          auth_user_id: string | null
          career_goal: string | null
          created_at: string
          id: string
          resume_path: string | null
          target_role: string | null
          updated_at: string
        }
        Insert: {
          auth_user_id?: string | null
          career_goal?: string | null
          created_at?: string
          id?: string
          resume_path?: string | null
          target_role?: string | null
          updated_at?: string
        }
        Update: {
          auth_user_id?: string | null
          career_goal?: string | null
          created_at?: string
          id?: string
          resume_path?: string | null
          target_role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      resumes: {
        Row: {
          created_at: string
          file_name: string
          file_path: string | null
          id: string
          profile_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path?: string | null
          id?: string
          profile_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string | null
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resumes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmap_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          profile_id: string
          skill: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          profile_id: string
          skill: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          profile_id?: string
          skill?: string
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_progress_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
