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
          type: string
          user_id: string
          user_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id: string
          type: string
          user_id: string
          user_name: string
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string
          type?: string
          user_id?: string
          user_name?: string
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
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
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
      prospects: {
        Row: {
          assigned_to: string | null
          company: string
          created_at: string
          first_message_date: string | null
          follow_up_count: number | null
          full_name: string
          hype: string
          id: string
          last_contact: string | null
          linkedin_url: string | null
          no_follow_up: boolean | null
          no_show: boolean | null
          position: string | null
          priority: string
          proposal_sent: boolean | null
          qualification: string
          r2_scheduled: boolean | null
          reminder_date: string | null
          status: string
          tags: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          company: string
          created_at?: string
          first_message_date?: string | null
          follow_up_count?: number | null
          full_name: string
          hype?: string
          id?: string
          last_contact?: string | null
          linkedin_url?: string | null
          no_follow_up?: boolean | null
          no_show?: boolean | null
          position?: string | null
          priority?: string
          proposal_sent?: boolean | null
          qualification?: string
          r2_scheduled?: boolean | null
          reminder_date?: string | null
          status?: string
          tags?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          company?: string
          created_at?: string
          first_message_date?: string | null
          follow_up_count?: number | null
          full_name?: string
          hype?: string
          id?: string
          last_contact?: string | null
          linkedin_url?: string | null
          no_follow_up?: boolean | null
          no_show?: boolean | null
          position?: string | null
          priority?: string
          proposal_sent?: boolean | null
          qualification?: string
          r2_scheduled?: boolean | null
          reminder_date?: string | null
          status?: string
          tags?: Json | null
          updated_at?: string
          user_id?: string
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
