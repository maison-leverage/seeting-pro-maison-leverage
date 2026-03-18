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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          created_at: string
          id: string
          lead_id: string
          message_type: string | null
          prospect_company: string | null
          prospect_name: string | null
          type: string
          user_id: string
          user_name: string
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id: string
          message_type?: string | null
          prospect_company?: string | null
          prospect_name?: string | null
          type: string
          user_id: string
          user_name: string
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string
          message_type?: string | null
          prospect_company?: string | null
          prospect_name?: string | null
          type?: string
          user_id?: string
          user_name?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_reports: {
        Row: {
          created_at: string
          error_message: string | null
          generated_at: string
          html_content: string
          id: string
          prospect_id: string
          score_accessibility: number | null
          score_best_practices: number | null
          score_geo: number | null
          score_performance: number | null
          score_seo: number | null
          status: string
          user_id: string
          website_url: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          generated_at?: string
          html_content: string
          id?: string
          prospect_id: string
          score_accessibility?: number | null
          score_best_practices?: number | null
          score_geo?: number | null
          score_performance?: number | null
          score_seo?: number | null
          status?: string
          user_id: string
          website_url: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          generated_at?: string
          html_content?: string
          id?: string
          prospect_id?: string
          score_accessibility?: number | null
          score_best_practices?: number | null
          score_geo?: number | null
          score_performance?: number | null
          score_seo?: number | null
          status?: string
          user_id?: string
          website_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_reports_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      formation_content: {
        Row: {
          created_at: string
          id: string
          section_key: string
          text_content: string | null
          updated_at: string
          videos: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          section_key: string
          text_content?: string | null
          updated_at?: string
          videos?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          section_key?: string
          text_content?: string | null
          updated_at?: string
          videos?: Json | null
        }
        Relationships: []
      }
      message_sends: {
        Row: {
          category: string
          got_reply: boolean | null
          id: string
          prospect_id: string
          reply_at: string | null
          sent_at: string | null
          user_id: string
          variant_id: string
        }
        Insert: {
          category: string
          got_reply?: boolean | null
          id?: string
          prospect_id: string
          reply_at?: string | null
          sent_at?: string | null
          user_id: string
          variant_id: string
        }
        Update: {
          category?: string
          got_reply?: boolean | null
          id?: string
          prospect_id?: string
          reply_at?: string | null
          sent_at?: string | null
          user_id?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_sends_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_sends_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "message_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      message_variants: {
        Row: {
          category: string
          content: string
          created_at: string | null
          id: string
          is_active: boolean | null
          is_control: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          category: string
          content: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_control?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_control?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          role: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name: string
          role?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      prospect_history: {
        Row: {
          action: string
          created_at: string
          created_by: string
          details: string | null
          id: string
          prospect_id: string
        }
        Insert: {
          action: string
          created_at?: string
          created_by: string
          details?: string | null
          id?: string
          prospect_id: string
        }
        Update: {
          action?: string
          created_at?: string
          created_by?: string
          details?: string | null
          id?: string
          prospect_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prospect_history_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      prospect_messages: {
        Row: {
          created_at: string
          id: string
          message_content: string
          prospect_id: string
          template_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_content: string
          prospect_id: string
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message_content?: string
          prospect_id?: string
          template_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      prospect_notes: {
        Row: {
          content: string
          created_at: string
          created_by: string
          id: string
          prospect_id: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          id?: string
          prospect_id: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          prospect_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prospect_notes_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      prospect_responses: {
        Row: {
          analysis_data: Json | null
          created_at: string | null
          created_by: string
          id: string
          prospect_id: string
          response_sentiment: string | null
          response_text: string
        }
        Insert: {
          analysis_data?: Json | null
          created_at?: string | null
          created_by: string
          id?: string
          prospect_id: string
          response_sentiment?: string | null
          response_text: string
        }
        Update: {
          analysis_data?: Json | null
          created_at?: string | null
          created_by?: string
          id?: string
          prospect_id?: string
          response_sentiment?: string | null
          response_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "prospect_responses_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      prospects: {
        Row: {
          assigned_to: string | null
          audit_generated: boolean | null
          audit_generated_at: string | null
          audit_pdf_url: string | null
          audit_score: number | null
          audit_sector: string | null
          audit_status: string | null
          company: string
          created_at: string
          deleted_at: string | null
          email: string | null
          first_message_date: string | null
          follow_up_count: number | null
          full_name: string
          hype: string
          id: string
          is_deleted: boolean | null
          last_contact: string | null
          linkedin_url: string | null
          lost_reason: string | null
          no_follow_up: boolean | null
          no_show: boolean | null
          position: string | null
          priority: string
          proposal_sent: boolean | null
          proposed_slots: string | null
          qualification: string
          r1_date: string | null
          r2_date: string | null
          r2_scheduled: boolean | null
          reminder_date: string | null
          source: string | null
          status: string
          tags: Json | null
          updated_at: string
          user_id: string
          website_url: string | null
        }
        Insert: {
          assigned_to?: string | null
          audit_generated?: boolean | null
          audit_generated_at?: string | null
          audit_pdf_url?: string | null
          audit_score?: number | null
          audit_sector?: string | null
          audit_status?: string | null
          company: string
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          first_message_date?: string | null
          follow_up_count?: number | null
          full_name: string
          hype?: string
          id?: string
          is_deleted?: boolean | null
          last_contact?: string | null
          linkedin_url?: string | null
          lost_reason?: string | null
          no_follow_up?: boolean | null
          no_show?: boolean | null
          position?: string | null
          priority?: string
          proposal_sent?: boolean | null
          proposed_slots?: string | null
          qualification?: string
          r1_date?: string | null
          r2_date?: string | null
          r2_scheduled?: boolean | null
          reminder_date?: string | null
          source?: string | null
          status?: string
          tags?: Json | null
          updated_at?: string
          user_id: string
          website_url?: string | null
        }
        Update: {
          assigned_to?: string | null
          audit_generated?: boolean | null
          audit_generated_at?: string | null
          audit_pdf_url?: string | null
          audit_score?: number | null
          audit_sector?: string | null
          audit_status?: string | null
          company?: string
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          first_message_date?: string | null
          follow_up_count?: number | null
          full_name?: string
          hype?: string
          id?: string
          is_deleted?: boolean | null
          last_contact?: string | null
          linkedin_url?: string | null
          lost_reason?: string | null
          no_follow_up?: boolean | null
          no_show?: boolean | null
          position?: string | null
          priority?: string
          proposal_sent?: boolean | null
          proposed_slots?: string | null
          qualification?: string
          r1_date?: string | null
          r2_date?: string | null
          r2_scheduled?: boolean | null
          reminder_date?: string | null
          source?: string | null
          status?: string
          tags?: Json | null
          updated_at?: string
          user_id?: string
          website_url?: string | null
        }
        Relationships: []
      }
      setter_objectives: {
        Row: {
          created_at: string
          daily_target: number
          id: string
          updated_at: string
          user_id: string | null
          weekly_target: number
          work_days: string[]
        }
        Insert: {
          created_at?: string
          daily_target?: number
          id?: string
          updated_at?: string
          user_id?: string | null
          weekly_target?: number
          work_days?: string[]
        }
        Update: {
          created_at?: string
          daily_target?: number
          id?: string
          updated_at?: string
          user_id?: string | null
          weekly_target?: number
          work_days?: string[]
        }
        Relationships: []
      }
      templates: {
        Row: {
          content: string
          created_at: string
          id: string
          name: string
          notes: string | null
          response_count: number | null
          sent_count: number | null
          sequence: string
          tags: Json | null
          target_sectors: Json | null
          target_sizes: Json | null
          target_types: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          response_count?: number | null
          sent_count?: number | null
          sequence: string
          tags?: Json | null
          target_sectors?: Json | null
          target_sizes?: Json | null
          target_types?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          response_count?: number | null
          sent_count?: number | null
          sequence?: string
          tags?: Json | null
          target_sectors?: Json | null
          target_sizes?: Json | null
          target_types?: Json | null
          updated_at?: string
          user_id?: string
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
