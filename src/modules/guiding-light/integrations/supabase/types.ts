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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cv_uploads: {
        Row: {
          candidate_email: string | null
          candidate_name: string | null
          candidate_phone: string | null
          created_at: string | null
          file_name: string
          file_path: string | null
          file_size: number | null
          file_type: string | null
          id: number
          notes: string | null
          status: string | null
          tags: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          candidate_email?: string | null
          candidate_name?: string | null
          candidate_phone?: string | null
          created_at?: string | null
          file_name: string
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: number
          notes?: string | null
          status?: string | null
          tags?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          candidate_email?: string | null
          candidate_name?: string | null
          candidate_phone?: string | null
          created_at?: string | null
          file_name?: string
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: number
          notes?: string | null
          status?: string | null
          tags?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      imported_candidates: {
        Row: {
          actual_role: string | null
          age: string | null
          cadre: string | null
          created_at: string | null
          email: string | null
          employee_number: string | null
          experience: string | null
          full_name: string | null
          gender: string | null
          goals: string | null
          id: string
          imported_at: string | null
          level_1: string | null
          level_2: string | null
          level_3: string | null
          level_4: string | null
          level_5: string | null
          level_6: string | null
          level_7: string | null
          linkedin_url: string | null
          notes: string | null
          phone: string | null
          qualification: string | null
          source_file: string | null
          source_platform: string | null
          specialization: string | null
        }
        Insert: {
          actual_role?: string | null
          age?: string | null
          cadre?: string | null
          created_at?: string | null
          email?: string | null
          employee_number?: string | null
          experience?: string | null
          full_name?: string | null
          gender?: string | null
          goals?: string | null
          id?: string
          imported_at?: string | null
          level_1?: string | null
          level_2?: string | null
          level_3?: string | null
          level_4?: string | null
          level_5?: string | null
          level_6?: string | null
          level_7?: string | null
          linkedin_url?: string | null
          notes?: string | null
          phone?: string | null
          qualification?: string | null
          source_file?: string | null
          source_platform?: string | null
          specialization?: string | null
        }
        Update: {
          actual_role?: string | null
          age?: string | null
          cadre?: string | null
          created_at?: string | null
          email?: string | null
          employee_number?: string | null
          experience?: string | null
          full_name?: string | null
          gender?: string | null
          goals?: string | null
          id?: string
          imported_at?: string | null
          level_1?: string | null
          level_2?: string | null
          level_3?: string | null
          level_4?: string | null
          level_5?: string | null
          level_6?: string | null
          level_7?: string | null
          linkedin_url?: string | null
          notes?: string | null
          phone?: string | null
          qualification?: string | null
          source_file?: string | null
          source_platform?: string | null
          specialization?: string | null
        }
        Relationships: []
      }
      interviews: {
        Row: {
          candidate_email: string | null
          candidate_linkedin: string | null
          candidate_location: string | null
          candidate_name: string
          candidate_title: string | null
          created_at: string | null
          date: string
          duration: string | null
          id: number
          match_score: number | null
          matched_skills: string[] | null
          notes: string | null
          scheduled_at: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          candidate_email?: string | null
          candidate_linkedin?: string | null
          candidate_location?: string | null
          candidate_name: string
          candidate_title?: string | null
          created_at?: string | null
          date: string
          duration?: string | null
          id?: number
          match_score?: number | null
          matched_skills?: string[] | null
          notes?: string | null
          scheduled_at?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          candidate_email?: string | null
          candidate_linkedin?: string | null
          candidate_location?: string | null
          candidate_name?: string
          candidate_title?: string | null
          created_at?: string | null
          date?: string
          duration?: string | null
          id?: number
          match_score?: number | null
          matched_skills?: string[] | null
          notes?: string | null
          scheduled_at?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          backlog: Json | null
          budget: number | null
          created_at: string | null
          description: string | null
          estimated_duration: string | null
          id: number
          priority: string | null
          progress: number | null
          resources: Json | null
          status: string | null
          team_hierarchy: Json | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          backlog?: Json | null
          budget?: number | null
          created_at?: string | null
          description?: string | null
          estimated_duration?: string | null
          id?: number
          priority?: string | null
          progress?: number | null
          resources?: Json | null
          status?: string | null
          team_hierarchy?: Json | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          backlog?: Json | null
          budget?: number | null
          created_at?: string | null
          description?: string | null
          estimated_duration?: string | null
          id?: number
          priority?: string | null
          progress?: number | null
          resources?: Json | null
          status?: string | null
          team_hierarchy?: Json | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      workflows: {
        Row: {
          connections: number | null
          created_at: string | null
          data: Json | null
          description: string | null
          id: number
          last_run: string | null
          name: string
          nodes: number | null
          user_id: string | null
        }
        Insert: {
          connections?: number | null
          created_at?: string | null
          data?: Json | null
          description?: string | null
          id?: number
          last_run?: string | null
          name: string
          nodes?: number | null
          user_id?: string | null
        }
        Update: {
          connections?: number | null
          created_at?: string | null
          data?: Json | null
          description?: string | null
          id?: number
          last_run?: string | null
          name?: string
          nodes?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: "hr" | "project_creator" | "admin"
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
    Enums: {
      user_role: ["hr", "project_creator", "admin"],
    },
  },
} as const
